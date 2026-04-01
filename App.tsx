import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';

import { Screen, GameMode, RGB, RoundResult } from './src/types';
import { generateRandomColor, calculateScore } from './src/utils/colorUtils';
import { getHighScore, saveHighScore } from './src/utils/storage';
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
import ColorRevealScreen       from './src/screens/ColorRevealScreen';
import GuessScreen             from './src/screens/GuessScreen';
import RoundResultScreen       from './src/screens/RoundResultScreen';
import GameOverScreen          from './src/screens/GameOverScreen';
import MatchmakingScreen       from './src/screens/competitive/MatchmakingScreen';
import CompetitiveResultScreen from './src/screens/competitive/CompetitiveResultScreen';

// ─── Sabitler ─────────────────────────────────────────────────────────────────
const SOLO_ROUNDS = 5;

export default function App() {
  // ── Ekran ve mod ──────────────────────────────────────────────────────────────
  const [screen,    setScreen]    = useState<Screen>('home');
  const [gameMode,  setGameMode]  = useState<GameMode>('solo');

  // ── Oyun state'i ──────────────────────────────────────────────────────────────
  const [currentRound,  setCurrentRound]  = useState(1);
  const [currentColor,  setCurrentColor]  = useState<RGB | null>(null);
  const [rounds,        setRounds]        = useState<RoundResult[]>([]);
  const [lastResult,    setLastResult]    = useState<RoundResult | null>(null);

  // ── Solo ──────────────────────────────────────────────────────────────────────
  const [highScore,      setHighScore]      = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // ── Kullanıcı profili ─────────────────────────────────────────────────────────
  const [userId,   setUserId]   = useState('');
  const [trophies, setTrophies] = useState(500);

  // ── Competitive ──────────────────────────────────────────────────────────────
  const [currentMatch,   setCurrentMatch]   = useState<CompMatch | null>(null);
  const [opponentScores, setOpponentScores] = useState<number[]>([]);
  const [compColors,     setCompColors]     = useState<RGB[]>([]);
  const [trophyDelta,    setTrophyDelta]    = useState(0);

  // Listener temizlik ref'leri — bileşen unmount olsa da doğru çalışır
  const cancelQueueRef    = useRef<(() => void) | null>(null);
  const stopMatchRef      = useRef<(() => void) | null>(null);
  // resolveCompResult'ın yalnızca bir kez çalışmasını garantile
  const compResolvedRef   = useRef(false);

  // ── Uygulama başlangıcı: profil yükle ────────────────────────────────────────
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [id, t, hs] = await Promise.all([
          getUserId(),
          getTrophies(),
          getHighScore(),
        ]);
        if (!active) return;
        setUserId(id);
        setTrophies(t);
        setHighScore(hs);
      } catch (e) {
        console.warn('[App] profil yüklenemedi:', e);
      }
    })();
    return () => { active = false; };
  }, []);

  // ── Temizlik: uygulama kapanırken aktif listener'ları durdur ──────────────────
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

  const handleRevealComplete = useCallback(() => {
    setScreen('guess');
  }, []);

  const handleGuessConfirm = useCallback(
    async (guess: RGB) => {
      if (!currentColor) return;

      const score = calculateScore(currentColor, guess);
      const result: RoundResult = {
        round:        currentRound,
        targetColor:  currentColor,
        guessedColor: guess,
        score,
      };

      const updatedRounds = [...rounds, result];
      setLastResult(result);
      setRounds(updatedRounds);

      // Competitive: güncel skoru Firebase'e gönder
      if (gameMode === 'competitive' && currentMatch) {
        const scoreArr = updatedRounds.map((r) => r.score);
        submitRoundScores(currentMatch.id, userId, scoreArr).catch(() => {});
      }

      setScreen('roundResult');

      // Solo son round: high score kaydet
      if (gameMode === 'solo' && currentRound === SOLO_ROUNDS) {
        const avg = Math.round(
          updatedRounds.reduce((s, r) => s + r.score, 0) / updatedRounds.length
        );
        try {
          const isNew = await saveHighScore(avg);
          setIsNewHighScore(isNew);
          if (isNew) setHighScore(avg);
        } catch (e) {
          console.warn('[App] high score kaydedilemedi:', e);
        }
      }
    },
    [currentColor, currentRound, rounds, gameMode, currentMatch, userId]
  );

  const handleNextRound = useCallback(() => {
    const totalRounds = gameMode === 'competitive' ? TOTAL_COMP_ROUNDS : SOLO_ROUNDS;

    if (currentRound >= totalRounds) {
      if (gameMode === 'solo') {
        setScreen('gameOver');
      } else {
        // Competitive: rakibin bitmesini bekle
        setScreen('comp_waiting');
      }
    } else {
      const next = currentRound + 1;
      setCurrentRound(next);
      if (gameMode === 'competitive') {
        // Firebase'den gelen rengi kullan; güvenli erişim
        setCurrentColor(compColors[next - 1] ?? generateRandomColor());
      } else {
        setCurrentColor(generateRandomColor());
      }
      setScreen('reveal');
    }
  }, [currentRound, gameMode, compColors]);

  // ─────────────────────────────────────────────────────────────────────────────
  // COMPETITIVE
  // ─────────────────────────────────────────────────────────────────────────────

  /** İki oyuncu da bitirdiğinde kupa hesapla ve sonuç ekranını göster */
  const resolveCompResult = useCallback(
    async (myScores: number[], oppScores: number[]) => {
      // Yalnızca bir kez çalış (listener birden fazla kez tetikleyebilir)
      if (compResolvedRef.current) return;
      compResolvedRef.current = true;

      stopMatchRef.current?.();
      stopMatchRef.current = null;

      const myTotal  = myScores.reduce((s, v) => s + v, 0);
      const oppTotal = oppScores.reduce((s, v) => s + v, 0);
      const delta    = calculateTrophyDelta(myTotal, oppTotal);

      try {
        const newTotal = await updateTrophies(delta);
        setTrophies(newTotal);
      } catch (e) {
        console.warn('[App] kupa güncellenemedi:', e);
      }

      setTrophyDelta(delta);
      setOpponentScores(oppScores);

      if (currentMatch) {
        clearUserMatch(userId).catch(() => {});
      }

      setScreen('comp_result');
    },
    [currentMatch, userId]
  );

  /** Maç bulunduğunda çağrılır — oyunu başlatır ve listener kurar */
  const handleMatchFound = useCallback(
    (match: CompMatch) => {
      // Önceki match listener'ını durdur
      stopMatchRef.current?.();
      compResolvedRef.current = false;

      setCurrentMatch(match);
      setCompColors(match.colors);

      // Maçı gerçek zamanlı dinle
      const stopListen = listenToMatch(match.id, (updated) => {
        const oppId     = updated.players.find((p) => p !== userId);
        if (!oppId) return;
        const oppScores = updated.scores?.[oppId] ?? [];
        const myScores  = updated.scores?.[userId] ?? [];
        setOpponentScores(oppScores);

        if (
          myScores.length  >= TOTAL_COMP_ROUNDS &&
          oppScores.length >= TOTAL_COMP_ROUNDS
        ) {
          resolveCompResult(myScores, oppScores);
        }
      });
      stopMatchRef.current = stopListen;

      setCurrentRound(1);
      setRounds([]);
      setLastResult(null);
      // İlk rengi güvenli şekilde al
      setCurrentColor(match.colors[0] ?? generateRandomColor());
      setScreen('reveal');
    },
    [userId, resolveCompResult]
  );

  const startMatchmaking = useCallback(async () => {
    if (!userId) return;

    // Önceki kuyruğu temizle
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

  const totalRounds = gameMode === 'competitive' ? TOTAL_COMP_ROUNDS : SOLO_ROUNDS;

  const renderScreen = (): React.ReactNode => {
    switch (screen) {

      case 'home':
        return (
          <HomeScreen
            onPlay={startSoloGame}
            onCompetitive={startMatchmaking}
            highScore={highScore}
            trophies={trophies}
          />
        );

      case 'reveal':
        if (!currentColor) return null;
        return (
          <ColorRevealScreen
            key={`reveal-${gameMode}-${currentRound}`}
            color={currentColor}
            currentRound={currentRound}
            totalRounds={totalRounds}
            onRevealComplete={handleRevealComplete}
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
        return (
          <MatchmakingScreen
            trophies={trophies}
            onCancel={cancelMatchmaking}
          />
        );

      case 'comp_waiting':
        return (
          <MatchmakingScreen
            trophies={trophies}
            onCancel={handleGoHome}
            waitingForOpponent
          />
        );

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
