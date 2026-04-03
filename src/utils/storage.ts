import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_SCORE_KEY   = '@color_match_high_score';
const GAME_HISTORY_KEY = '@color_match_game_history';
const STREAK_KEY       = '@color_match_streak';
const MAX_HISTORY      = 5;
const STREAK_TIMEOUT   = 36 * 60 * 60 * 1000; // 36 saat (ms)

interface StreakData {
  currentStreak: number;
  lastPlayedAt:  number; // timestamp
}

export interface GameRecord {
  date: string;
  averageScore: number;
  totalScore: number;
  rounds: number;
}

/** Persists a new high score only if it exceeds the existing one */
export const saveHighScore = async (averageScore: number): Promise<boolean> => {
  try {
    const existing = await getHighScore();
    if (averageScore > existing) {
      await AsyncStorage.setItem(HIGH_SCORE_KEY, averageScore.toString());
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/** Returns the stored all-time best average score, or 0 if none */
export const getHighScore = async (): Promise<number> => {
  try {
    const value = await AsyncStorage.getItem(HIGH_SCORE_KEY);
    return value ? parseInt(value, 10) : 0;
  } catch {
    return 0;
  }
};

/** Saves a completed game to history — keeps top 5 by averageScore */
export const saveGameRecord = async (record: GameRecord): Promise<void> => {
  try {
    const existing = await getTopScores();
    const updated  = [...existing, record]
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
};

/** Returns up to 5 best game records sorted by averageScore desc */
export const getTopScores = async (): Promise<GameRecord[]> => {
  try {
    const raw = await AsyncStorage.getItem(GAME_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/** Returns current streak (0 if expired) */
export const getStreak = async (): Promise<number> => {
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    if (!raw) return 0;
    const data: StreakData = JSON.parse(raw);
    if (Date.now() - data.lastPlayedAt > STREAK_TIMEOUT) return 0;
    return data.currentStreak;
  } catch {
    return 0;
  }
};

/** Updates streak after a completed game. Returns new streak count. */
export const updateStreak = async (): Promise<number> => {
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    const now = Date.now();
    let newStreak = 1;

    if (raw) {
      const data: StreakData = JSON.parse(raw);
      if (now - data.lastPlayedAt <= STREAK_TIMEOUT) {
        newStreak = data.currentStreak + 1;
      }
    }

    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({
      currentStreak: newStreak,
      lastPlayedAt: now,
    }));
    return newStreak;
  } catch {
    return 1;
  }
};
