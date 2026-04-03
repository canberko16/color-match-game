import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';

import { Screen, GameMode, RGB, RoundResult, DailyAttempt } from './src/types';
import { generateRandomColor, calculateScore } from './src/utils/colorUtils';
import { getHighScore, saveHighScore, saveGameRecord, getStreak, updateStreak } from './src/utils/storage';
import { getDailyColor, getDateKey } from './src/utils/dailyColor';
import { getDailyAttempt, saveDailyAttempt } from './src/utils/dailyStorage';
import { submitDailyScore } from './src/utils/dailyLeaderboard';
import { initSettings } from './src/utils/settings';
import { getUserId, getTrophies, updateTrophies } from './src/utils/userProfile';
import {
  joinQueue,
  listenToMatch,
  submitRoundScores,
  clearUserMatch,
  CompMatch,
  TOTAL_COMP_ROUNDS,
} from './src/utils/matchmaking';
import { calculateTrophyDelta } from './src/utils/mmr';

import ErrorBoundary           from './src/components/ErrorBoundary';
import HomeScreen              from './src/screens/HomeScreen';
import SettingsScreen          from './src/screens/SettingsScreen';
import ColorRevealScreen       from './src/screens/ColorRevealScreen';
import GuessScreen             from './src/screens/GuessScreen';
import RoundResultScreen       from './src/screens/RoundResultScreen';
import GameOverScreen          from './src/screens/GameOverScreen';
import MatchmakingScreen       from './src/screens/competitive/MatchmakingScreen';
import CompetitiveResultScreen from './src/screens/competitive/CompetitiveResultScreen';
import DailyCalendarScreen     from './src/screens/daily/DailyCalendarScreen';
import DailyResultScreen       from './src/screens/daily/DailyResultScreen';

const SOLO_ROUNDS = 5;

export default function App() {
  const [screen,   setScreen]   = useState<Screen>('home');
  const [gameMode, setGameMode] = useState<GameMode>('solo');

  const [currentRound, setCurrentRound] = useState(1);
  const [currentColor, setCurrentColor] = useState<RGB | null>(null);
  const [rounds,       setRounds]       = useState<RoundResult[]>([]);
  const [lastResult,   setLastResult]   = useState<RoundResult | null>(null);

  const [highScore,      setHighScore]      = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [streak,         setStreak]         = useState(0);

  const [userId,   setUserId]   = useState('');
  const [trophies, setTrophies] = useState(500);

  const [currentMatch,   setCurrentMatch]   = useState<CompMatch | null>(null);
  const [opponentScores, setOpponentScores] = useState<number[]>([]);
  const [compColors,     setCompColors]     = useState<RGB[]>([]);
  const [trophyDelta,    setTrophyDelta]    = useState(0);

  // Daily challenge state
  const [dailyDateKey, setDailyDateKey] = useState('');
  const [dailyAttempt, setDailyAttempt] = useState<DailyAttempt | null>(null);

  const cancelQueueRef  = useRef<(() => void) | null>(null);
  const stopMatchRef    = useRef<(() => void) | null>(null);
  const compResolvedRef = useRef(false);

  // ── Başlangıç: profil + ayarları yükle ──────────────────────────────────────
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [id, t, hs, st] = await Promise.all([
          getUserId(),
          getTrophies(),
          getHighScore(),
          getStreak(),
          initSettings(), // cache'i doldurur, void döner
        ]);
        if (!active) return;
        setUserId(id);
        setTrophies(t);
        setHighScore(hs);
        setStreak(st);
      } catch (e) {
        console.warn('[App] başlatma hatası:', e);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    return () => {
      stopMatchRef.current?.();
      cancelQueueRef.current?.();
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // SOLO
  // ─────────────────────────────────────────────────────────────────────────────

  const startSoloGame = useCallback(() => {
    setGameMode('solo');
    setCurrentRound(1);
    setRounds([]);
    setLastResult(null);
    setIsNewHighScore(false);
    setCurrentColor(generateRandomColor());
    setScreen('reveal');
  }, []);

  const handleRevealComplete = useCallback(() => setScreen('guess'), []);

  const handleGuessConfirm = useCallback(
    async (guess: RGB, timeMs?: number) => {
      if (!currentColor) return;

      // Daily modda ayrı handler'a yönlendir
      if (gameMode === 'daily') {
        handleDailyGuessConfirm(guess, timeMs);
        return;
      }

      const score = calculateScore(currentColor, guess);
      const result: RoundResult = {
        round: currentRound, targetColor: currentColor, guessedColor: guess, score,
      };
      const updatedRounds = [...rounds, result];
      setLastResult(result);
      setRounds(updatedRounds);

      if (gameMode === 'competitive' && currentMatch) {
        submitRoundScores(currentMatch.id, userId, updatedRounds.map(r => r.score)).catch(() => {});
      }

      // Daily modda roundResult'a değil dailyResult'a gider (handleDailyGuessConfirm ile)
      if (gameMode !== 'daily') setScreen('roundResult');

      if (gameMode === 'solo' && currentRound === SOLO_ROUNDS) {
        const avg = Math.round(updatedRounds.reduce((s, r) => s + r.score, 0) / updatedRounds.length);
        try {
          const isNew = await saveHighScore(avg);
          setIsNewHighScore(isNew);
          if (isNew) setHighScore(avg);
          await saveGameRecord({
            date: new Date().toISOString(),
            averageScore: avg,
            totalScore: updatedRounds.reduce((s, r) => s + r.score, 0),
            rounds: updatedRounds.length,
          });
          const newStreak = await updateStreak();
          setStreak(newStreak);
        } catch (e) {
          console.warn('[App] skor kaydedilemedi:', e);
        }
      }
    },
    [currentColor, currentRound, rounds, gameMode, currentMatch, userId, handleDailyGuessConfirm]
  );

  const handleNextRound = useCallback(() => {
    const total = gameMode === 'competitive' ? TOTAL_COMP_ROUNDS : SOLO_ROUNDS;
    if (currentRound >= total) {
      setScreen(gameMode === 'solo' ? 'gameOver' : 'comp_waiting');
    } else {
      const next = currentRound + 1;
      setCurrentRound(next);
      setCurrentColor(
        gameMode === 'competitive'
          ? (compColors[next - 1] ?? generateRandomColor())
          : generateRandomColor()
      );
      setScreen('reveal');
    }
  }, [currentRound, gameMode, compColors]);

  // ─────────────────────────────────────────────────────────────────────────────
  // DAILY CHALLENGE
  // ─────────────────────────────────────────────────────────────────────────────

  const openDailyCalendar = useCallback(() => {
    setScreen('dailyCalendar');
  }, []);

  const startDailyChallenge = useCallback((dateKey: string) => {
    setGameMode('daily');
    setDailyDateKey(dateKey);
    setDailyAttempt(null);
    setCurrentRound(1);
    setRounds([]);
    setLastResult(null);
    setCurrentColor(getDailyColor(dateKey));
    setScreen('reveal');
  }, []);

  const handleDailyGuessConfirm = useCallback(
    async (guess: RGB, timeMs?: number) => {
      if (!currentColor || !dailyDateKey) return;

      const score = calculateScore(currentColor, guess);
      const attempt: DailyAttempt = {
        dateKey: dailyDateKey,
        targetColor: currentColor,
        guessedColor: guess,
        score,
        timeMs: timeMs ?? 0,
        completedAt: Date.now(),
      };

      setDailyAttempt(attempt);
      await saveDailyAttempt(attempt);
      submitDailyScore(dailyDateKey, userId, score, attempt.timeMs).catch(() => {});

      const newStreak = await updateStreak();
      setStreak(newStreak);

      setScreen('dailyResult');
    },
    [currentColor, dailyDateKey, userId]
  );

  const handleViewDailyResult = useCallback(async (dateKey: string) => {
    const attempt = await getDailyAttempt(dateKey);
    if (attempt) {
      setDailyAttempt(attempt);
      setDailyDateKey(dateKey);
      setScreen('dailyResult');
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // COMPETITIVE
  // ─────────────────────────────────────────────────────────────────────────────

  const resolveCompResult = useCallback(
    async (myScores: number[], oppScores: number[]) => {
      if (compResolvedRef.current) return;
      compResolvedRef.current = true;
      stopMatchRef.current?.();
      stopMatchRef.current = null;

      const delta = calculateTrophyDelta(
        myScores.reduce((s, v) => s + v, 0),
        oppScores.reduce((s, v) => s + v, 0)
      );
      try {
        const newTotal = await updateTrophies(delta);
        setTrophies(newTotal);
      } catch (e) {
        console.warn('[App] kupa güncellenemedi:', e);
      }
      setTrophyDelta(delta);
      setOpponentScores(oppScores);
      if (currentMatch) clearUserMatch(userId).catch(() => {});
      setScreen('comp_result');
    },
    [currentMatch, userId]
  );

  const handleMatchFound = useCallback(
    (match: CompMatch) => {
      stopMatchRef.current?.();
      compResolvedRef.current = false;
      setCurrentMatch(match);
      setCompColors(match.colors);

      const stopListen = listenToMatch(match.id, (updated) => {
        const oppId     = updated.players.find(p => p !== userId);
        if (!oppId) return;
        const oppScores = updated.scores?.[oppId] ?? [];
        const myScores  = updated.scores?.[userId] ?? [];
        setOpponentScores(oppScores);
        if (myScores.length >= TOTAL_COMP_ROUNDS && oppScores.length >= TOTAL_COMP_ROUNDS) {
          resolveCompResult(myScores, oppScores);
        }
      });
      stopMatchRef.current = stopListen;

      setCurrentRound(1);
      setRounds([]);
      setLastResult(null);
      setCurrentColor(match.colors[0] ?? generateRandomColor());
      setScreen('reveal');
    },
    [userId, resolveCompResult]
  );

  const startMatchmaking = useCallback(async () => {
    if (!userId) return;
    cancelQueueRef.current?.();
    cancelQueueRef.current = null;
    setGameMode('competitive');
    setCurrentRound(1);
    setRounds([]);
    setLastResult(null);
    setOpponentScores([]);
    setCurrentMatch(null);
    compResolvedRef.current = false;
    setScreen('matchmaking');
    try {
      const cancel = await joinQueue(userId, trophies, handleMatchFound);
      cancelQueueRef.current = cancel;
    } catch (e) {
      console.error('[App] matchmaking başlatılamadı:', e);
      setScreen('home');
    }
  }, [userId, trophies, handleMatchFound]);

  const cancelMatchmaking = useCallback(() => {
    cancelQueueRef.current?.();
    cancelQueueRef.current = null;
    stopMatchRef.current?.();
    stopMatchRef.current = null;
    setScreen('home');
  }, []);

  const handleGoHome = useCallback(() => {
    stopMatchRef.current?.();
    stopMatchRef.current = null;
    cancelQueueRef.current?.();
    cancelQueueRef.current = null;
    setCurrentMatch(null);
    compResolvedRef.current = false;
    setScreen('home');
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  const totalRounds = gameMode === 'daily' ? 1 : gameMode === 'competitive' ? TOTAL_COMP_ROUNDS : SOLO_ROUNDS;

  const renderScreen = (): React.ReactNode => {
    switch (screen) {
      case 'home':
        return (
          <HomeScreen
            onPlay={startSoloGame}
            onCompetitive={startMatchmaking}
            onDailyChallenge={openDailyCalendar}
            onSettings={() => setScreen('settings')}
            highScore={highScore}
            trophies={trophies}
            streak={streak}
          />
        );

      case 'settings':
        return <SettingsScreen onBack={() => setScreen('home')} />;

      case 'reveal':
        if (!currentColor) return null;
        return (
          <ColorRevealScreen
            key={`reveal-${gameMode}-${currentRound}`}
            color={currentColor}
            currentRound={currentRound}
            totalRounds={totalRounds}
            onRevealComplete={handleRevealComplete}
            onHome={handleGoHome}
          />
        );

      case 'guess':
        if (!currentColor) return null;
        return (
          <GuessScreen
            key={`guess-${gameMode}-${currentRound}`}
            currentRound={currentRound}
            totalRounds={totalRounds}
            previousRounds={rounds}
            onConfirm={handleGuessConfirm}
            onHome={handleGoHome}
            isDaily={gameMode === 'daily'}
          />
        );

      case 'roundResult':
        if (!lastResult) return null;
        return (
          <RoundResultScreen
            key={`result-${gameMode}-${currentRound}`}
            result={lastResult}
            allRounds={rounds}
            totalRounds={totalRounds}
            isLastRound={currentRound >= totalRounds}
            onNext={handleNextRound}
            onHome={handleGoHome}
          />
        );

      case 'gameOver':
        return (
          <GameOverScreen
            rounds={rounds}
            isNewHighScore={isNewHighScore}
            onPlayAgain={startSoloGame}
            onHome={handleGoHome}
          />
        );

      case 'matchmaking':
        return <MatchmakingScreen trophies={trophies} onCancel={cancelMatchmaking} />;

      case 'comp_waiting':
        return <MatchmakingScreen trophies={trophies} onCancel={handleGoHome} waitingForOpponent />;

      case 'comp_result':
        return (
          <CompetitiveResultScreen
            myRounds={rounds}
            opponentScores={opponentScores}
            trophyDelta={trophyDelta}
            newTrophyTotal={trophies}
            onPlayAgain={startMatchmaking}
            onHome={handleGoHome}
          />
        );

      case 'dailyCalendar':
        return (
          <DailyCalendarScreen
            onPlayDay={startDailyChallenge}
            onViewResult={handleViewDailyResult}
            onBack={() => setScreen('home')}
          />
        );

      case 'dailyResult':
        if (!dailyAttempt) return null;
        return (
          <DailyResultScreen
            attempt={dailyAttempt}
            userId={userId}
            onBack={() => setScreen('dailyCalendar')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <ErrorBoundary onReset={handleGoHome}>
      <StatusBar style="light" />
      {renderScreen()}
    </ErrorBoundary>
  );
}
