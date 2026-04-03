import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyAttempt, DailyCalendarDay, DayStatus } from '../types';
import { getDateKey, DAILY_CHALLENGE_START } from './dailyColor';

const ATTEMPTS_KEY = '@cmatch_daily_attempts';
const UNLOCKED_KEY = '@cmatch_daily_unlocked';

// ── Attempt CRUD ──────────────────────────────────────────────────────────────

export const getDailyAttempt = async (dateKey: string): Promise<DailyAttempt | null> => {
  try {
    const all = await getAllDailyAttempts();
    return all[dateKey] ?? null;
  } catch {
    return null;
  }
};

export const saveDailyAttempt = async (attempt: DailyAttempt): Promise<void> => {
  try {
    const all = await getAllDailyAttempts();
    all[attempt.dateKey] = attempt;
    await AsyncStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
};

export const getAllDailyAttempts = async (): Promise<Record<string, DailyAttempt>> => {
  try {
    const raw = await AsyncStorage.getItem(ATTEMPTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

// ── Reklam ile açılan günler ──────────────────────────────────────────────────

export const getUnlockedDays = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(UNLOCKED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const unlockDay = async (dateKey: string): Promise<void> => {
  try {
    const days = await getUnlockedDays();
    if (!days.includes(dateKey)) {
      days.push(dateKey);
      await AsyncStorage.setItem(UNLOCKED_KEY, JSON.stringify(days));
    }
  } catch {
    // ignore
  }
};

// ── Gün oynanabilirlik kontrolü ───────────────────────────────────────────────

export const isDayPlayable = async (
  dateKey: string
): Promise<{ playable: boolean; needsAd: boolean }> => {
  const today = getDateKey();

  // Gelecek gün → oynanamaz
  if (dateKey > today) return { playable: false, needsAd: false };

  // Challenge başlangıç tarihinden önce → oynanamaz
  if (dateKey < DAILY_CHALLENGE_START) return { playable: false, needsAd: false };

  // Zaten oynanmış → tekrar oynanamaz
  const attempt = await getDailyAttempt(dateKey);
  if (attempt) return { playable: false, needsAd: false };

  // Bugün → ücretsiz
  if (dateKey === today) return { playable: true, needsAd: false };

  // Geçmiş gün → reklam gerekebilir
  const unlocked = await getUnlockedDays();
  if (unlocked.includes(dateKey)) return { playable: true, needsAd: false };

  // Reklam izlenmesi gerekiyor
  return { playable: true, needsAd: true };
};

// ── Takvim verisi ─────────────────────────────────────────────────────────────

export const getCalendarData = async (
  year: number,
  month: number // 0-indexed (JS Date convention)
): Promise<DailyCalendarDay[]> => {
  const today = getDateKey();
  const attempts = await getAllDailyAttempts();
  const unlocked = await getUnlockedDays();

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: DailyCalendarDay[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateKey = getDateKey(date);

    let status: DayStatus;
    const attempt = attempts[dateKey];

    if (dateKey > today) {
      status = 'future';
    } else if (dateKey === today) {
      status = attempt ? 'today_played' : 'today';
    } else if (dateKey < DAILY_CHALLENGE_START) {
      status = 'locked';
    } else if (attempt) {
      status = 'played';
    } else {
      status = 'unplayed'; // geçmiş gün, oynanmamış — reklam ile açılabilir
    }

    days.push({
      dateKey,
      dayNum: d,
      status,
      score: attempt?.score,
    });
  }

  // Haftanın başlangıcına göre boş hücre ekle (Pazartesi = 0)
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Pzt, 6=Paz
  for (let i = 0; i < startDow; i++) {
    days.unshift({ dateKey: '', dayNum: 0, status: 'locked' });
  }

  return days;
};
