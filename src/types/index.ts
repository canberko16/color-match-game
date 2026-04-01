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
  | 'reveal'         // Hedef renk gösterimi (solo + competitive ortak)
  | 'guess'          // RGB slider ile tahmin (solo + competitive ortak)
  | 'roundResult'    // Round sonucu (solo + competitive ortak)
  | 'gameOver'       // Solo bitiş ekranı
  | 'matchmaking'    // Competitive: rakip arama
  | 'comp_waiting'   // Competitive: rakibin bitmesini bekleme
  | 'comp_result';   // Competitive: maç sonucu

export type GameMode = 'solo' | 'competitive';
