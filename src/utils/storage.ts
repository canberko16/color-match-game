import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_SCORE_KEY   = '@color_match_high_score';
const GAME_HISTORY_KEY = '@color_match_game_history';
const MAX_HISTORY      = 5;

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
