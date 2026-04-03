import { RGB } from '../types';

/**
 * Deterministic günlük renk üretimi.
 * Aynı tarih string'i her cihazda aynı rengi üretir.
 * Server'a gerek yoktur.
 */

/** djb2 hash fonksiyonu — string'den tekrarlanabilir sayı üretir */
const hashString = (s: string): number => {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

/** Tarih string'inden (YYYY-MM-DD) deterministik RGB renk üretir */
export const getDailyColor = (dateKey: string): RGB => {
  // Farklı salt'lar ile 3 bağımsız hash üret
  const h1 = hashString(dateKey + '_R_colormatch');
  const h2 = hashString(dateKey + '_G_colormatch');
  const h3 = hashString(dateKey + '_B_colormatch');

  return {
    r: h1 % 256,
    g: h2 % 256,
    b: h3 % 256,
  };
};

/** Date objesinden "YYYY-MM-DD" formatında UTC tarih key'i döner */
export const getDateKey = (date?: Date): string => {
  const d = date ?? new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Günlük challenge'ın başladığı tarih — bundan öncesi açılamaz */
export const DAILY_CHALLENGE_START = '2026-04-01';
