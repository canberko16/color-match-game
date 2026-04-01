/** Kazanma / kaybetme başına kupa değişimi */
export const TROPHY_WIN  =  25;
export const TROPHY_LOSS =  15;
export const TROPHY_DRAW =   0;

/** Kupa kademesi tanımı */
export interface Tier {
  name:        string;
  emoji:       string;
  minTrophies: number;
  color:       string;
}

/** Sıralamaya göre kademeler (küçükten büyüğe) */
export const TIERS: Tier[] = [
  { name: 'Bronz',  emoji: '🥉', minTrophies:    0, color: '#CD7F32' },
  { name: 'Gümüş',  emoji: '🥈', minTrophies:  500, color: '#C0C0C0' },
  { name: 'Altın',  emoji: '🥇', minTrophies: 1000, color: '#FFD700' },
  { name: 'Elmas',  emoji: '💎', minTrophies: 2000, color: '#7DF9FF' },
  { name: 'Master', emoji: '👑', minTrophies: 3000, color: '#FF69B4' },
];

/** Verilen kupa sayısına göre kademeyi döner */
export const getTier = (trophies: number): Tier =>
  [...TIERS].reverse().find((t) => trophies >= t.minTrophies) ?? TIERS[0];

/**
 * İki oyuncunun toplam skoruna göre kupa delta'sını hesaplar.
 * Kazanırsan +TROPHY_WIN, kaybedersen -TROPHY_LOSS, berabere 0.
 */
export const calculateTrophyDelta = (
  myTotalScore: number,
  opponentTotalScore: number
): number => {
  if (myTotalScore > opponentTotalScore)  return  TROPHY_WIN;
  if (myTotalScore < opponentTotalScore)  return -TROPHY_LOSS;
  return TROPHY_DRAW;
};

/** Kupa deltasına göre kullanıcıya gösterilecek sonuç metni */
export const getMatchResultLabel = (delta: number): { text: string; emoji: string; color: string } => {
  if (delta > 0)  return { text: 'Kazandın!',   emoji: '🏆', color: '#4CAF50' };
  if (delta < 0)  return { text: 'Kaybettin',   emoji: '😔', color: '#F44336' };
  return             { text: 'Berabere!',        emoji: '🤝', color: '#FFC107' };
};
