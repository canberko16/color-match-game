import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_SCORE_KEY = '@color_match_high_score';

/** Persists a new high score only if it exceeds the existing one */
export const saveHighScore = async (averageScore: number): Promise<boolean> => {
  try {
    const existing = await getHighScore();
    if (averageScore > existing) {
      await AsyncStorage.setItem(HIGH_SCORE_KEY, averageScore.toString());
      return true; // new record
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
