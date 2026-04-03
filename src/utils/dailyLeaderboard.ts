import {
  ref,
  push,
  set,
  get,
  query,
  orderByChild,
  limitToLast,
} from 'firebase/database';
import { db } from '../config/firebase';
import { LeaderboardEntry } from '../types';

const LEADERBOARD_PATH = 'colorMatch/dailyLeaderboard';

/** Günlük skor gönder — aynı userId tekrar yazamaz (client-side check) */
export const submitDailyScore = async (
  dateKey: string,
  userId: string,
  score: number,
  timeMs: number
): Promise<void> => {
  try {
    // Önce aynı userId zaten var mı kontrol et
    const existing = await fetchDailyLeaderboard(dateKey, 500);
    if (existing.some((e) => e.userId === userId)) return;

    const entryRef = push(ref(db, `${LEADERBOARD_PATH}/${dateKey}`));
    await set(entryRef, {
      userId,
      score,
      timeMs,
      completedAt: Date.now(),
    });
  } catch (err) {
    console.warn('[dailyLeaderboard] skor gönderilemedi:', err);
  }
};

/** Günlük leaderboard'ı getir — skor azalan, süre artan sıralı */
export const fetchDailyLeaderboard = async (
  dateKey: string,
  limit = 100
): Promise<LeaderboardEntry[]> => {
  try {
    const q = query(
      ref(db, `${LEADERBOARD_PATH}/${dateKey}`),
      orderByChild('score'),
      limitToLast(limit)
    );
    const snap = await get(q);
    if (!snap.exists()) return [];

    const entries: LeaderboardEntry[] = [];
    snap.forEach((child) => {
      entries.push(child.val() as LeaderboardEntry);
    });

    // Sıralama: skor azalan → süre artan → erken oynayan önde
    return entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
      return a.completedAt - b.completedAt;
    });
  } catch (err) {
    console.warn('[dailyLeaderboard] veri alınamadı:', err);
    return [];
  }
};

/** Kullanıcının sıralamasını ve toplam oyuncu sayısını döner */
export const getUserRankInfo = async (
  dateKey: string,
  userId: string
): Promise<{ rank: number; total: number } | null> => {
  try {
    const entries = await fetchDailyLeaderboard(dateKey, 500);
    if (entries.length === 0) return null;

    const rank = entries.findIndex((e) => e.userId === userId);
    if (rank === -1) return null;

    return { rank: rank + 1, total: entries.length };
  } catch {
    return null;
  }
};
