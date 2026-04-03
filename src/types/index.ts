/** Represents an RGB color with integer values 0–255 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Result data for a single completed round */
export interface RoundResult {
  round: number;
  targetColor: RGB;
  guessedColor: RGB;
  score: number;
}

/** All possible screens / game phases */
export type Screen =
  | 'home'           // Ana menü
  | 'reveal'         // Hedef renk gösterimi (solo + competitive + daily ortak)
  | 'guess'          // RGB slider ile tahmin (solo + competitive + daily ortak)
  | 'roundResult'    // Round sonucu (solo + competitive ortak)
  | 'gameOver'       // Solo bitiş ekranı
  | 'matchmaking'    // Competitive: rakip arama
  | 'comp_waiting'   // Competitive: rakibin bitmesini bekleme
  | 'comp_result'    // Competitive: maç sonucu
  | 'settings'       // Ayarlar ekranı
  | 'dailyCalendar'  // Günlük challenge takvim ekranı
  | 'dailyResult';   // Günlük challenge sonuç + leaderboard

export type GameMode = 'solo' | 'competitive' | 'daily';

/** Günlük challenge attempt verisi */
export interface DailyAttempt {
  dateKey: string;       // "2026-04-03"
  targetColor: RGB;
  guessedColor: RGB;
  score: number;
  timeMs: number;        // tahmin süresi (ms)
  completedAt: number;   // timestamp
}

/** Takvim hücresi durumu */
export type DayStatus = 'played' | 'unplayed' | 'today' | 'today_played' | 'locked' | 'future';

export interface DailyCalendarDay {
  dateKey: string;
  dayNum: number;
  status: DayStatus;
  score?: number;
}

/** Leaderboard girişi */
export interface LeaderboardEntry {
  userId: string;
  score: number;
  timeMs: number;
  completedAt: number;
}
