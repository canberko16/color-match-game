import { RGB } from '../types';

/** Rastgele bir RGB rengi üretir */
export const generateRandomColor = (): RGB => ({
  r: Math.floor(Math.random() * 256),
  g: Math.floor(Math.random() * 256),
  b: Math.floor(Math.random() * 256),
});

/** RGB nesnesini React Native'in anladığı rgb() string'ine çevirir */
export const rgbToString = ({ r, g, b }: RGB): string =>
  `rgb(${r}, ${g}, ${b})`;

/** RGB nesnesini büyük harfli hex string'e çevirir (ör. #FF3A2C) */
export const rgbToHex = ({ r, g, b }: RGB): string => {
  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * RGB uzayındaki maksimum Öklid mesafesi.
 * sqrt(255² + 255² + 255²) ≈ 441.67
 */
const MAX_DISTANCE = Math.sqrt(255 ** 2 + 255 ** 2 + 255 ** 2);

/**
 * Puanlama sistemi — Karesel eğri (quadratic falloff)
 *
 * ─── Formül: score = 100 × (1 − d/MAX)² ─────────────────────────────────────
 *
 *  Bu formülle:
 *  • ±5/kanal fark  → ~96 puan  (neredeyse mükemmel)               ✓
 *  • ±10/kanal fark → ~91 puan  (çok yakın)                        ✓
 *  • ±25/kanal fark → ~81 puan  (iyi tahmin — hedef hassasiyet)    ✓
 *  • ±40/kanal fark → ~69 puan  (fena değil)                       ✓
 *  • ±60/kanal fark → ~53 puan  (idare eder)                       ✓
 *  • Gri → Kırmızı  → ~25 puan  (alakasız = düşük)                 ✓
 *  • Ortada bırakma → ortalama ~53, >60 şansı %24                  ✓
 *
 *  Sonuç: ±25 kanal hassasiyetiyle 80+ puan alınabilir.
 *         90+ için kanal başına ±10 hata tolere edilir.
 */
export const calculateScore = (target: RGB, guess: RGB): number => {
  const distance = Math.sqrt(
    (target.r - guess.r) ** 2 +
    (target.g - guess.g) ** 2 +
    (target.b - guess.b) ** 2
  );
  const normalized = distance / MAX_DISTANCE;           // 0..1 arası
  const score      = 100 * (1 - normalized) ** 2;       // karesel eğri — dengeli zorluk
  return Math.round(Math.max(0, Math.min(100, score)));
};

/**
 * ^2 eğrisine göre kalibre edilmiş yorumlar:
 *   92+ → ±5/kanal veya daha az    (gerçekten mükemmel)
 *   82+ → ±25/kanal civarı         (çok yakın)
 *   65+ → ±45/kanal civarı         (fena değil)
 *   45+ → ±65/kanal civarı         (idare eder)
 *   <45 → daha uzak / alakasız
 */
export const getScoreComment = (score: number): string => {
  if (score >= 92) return 'Mükemmel!';
  if (score >= 82) return 'Çok Yakın!';
  if (score >= 65) return 'Fena Değil';
  if (score >= 45) return 'İdare Eder';
  return 'Bir Dahaki Sefere!';
};

export const getScoreEmoji = (score: number): string => {
  if (score >= 92) return '🎯';
  if (score >= 82) return '✨';
  if (score >= 65) return '👍';
  if (score >= 45) return '😐';
  return '💪';
};

/**
 * Skor badge rengi — ^2 eğrisine göre:
 *   Yeşil  : 80+ (±25/kanal veya daha iyi)
 *   Sarı   : 50–80 (makul çaba)
 *   Kırmızı: <50 (alakasız veya az çaba)
 */
export const getScoreColor = (score: number): string => {
  if (score >= 80) return '#4CAF50';
  if (score >= 50) return '#FFC107';
  return '#F44336';
};

/**
 * Arka plan rengi üzerinde okunabilirliği yüksek rengi döner
 * (#000000 veya #FFFFFF).
 */
export const getContrastColor = ({ r, g, b }: RGB): string => {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};
