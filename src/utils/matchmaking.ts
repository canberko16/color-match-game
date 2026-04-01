import {
  ref,
  set,
  get,
  push,
  remove,
  onValue,
  off,
  onDisconnect,
  runTransaction,
  DataSnapshot,
} from 'firebase/database';
import { db } from '../config/firebase';
import { RGB } from '../types';
import { generateRandomColor } from './colorUtils';

// ─── Firebase veri yolları ────────────────────────────────────────────────────
const QUEUE_PATH        = 'colorMatch/queue';
const MATCHES_PATH      = 'colorMatch/matches';
const USER_MATCHES_PATH = 'colorMatch/userMatches';

export const TOTAL_COMP_ROUNDS = 5;

// ─── Tipler ───────────────────────────────────────────────────────────────────

export interface QueueEntry {
  userId:   string;
  trophies: number;
  joinedAt: number;
}

export interface CompMatch {
  id:        string;
  players:   [string, string];
  colors:    RGB[];
  scores:    Record<string, number[]>; // userId → [round skorları]
  status:    'active' | 'finished';
  createdAt: number;
}

// ─── Eşleşme arama ───────────────────────────────────────────────────────────

/**
 * Oyuncuyu kuyruğa ekler ve maç kurulduğunda onMatchFound callback'ini çağırır.
 * Döndürülen fonksiyonu çağırarak arama iptal edilebilir.
 */
export const joinQueue = async (
  userId:       string,
  trophies:     number,
  onMatchFound: (match: CompMatch) => void
): Promise<() => void> => {
  try {
    const myQueueRef   = ref(db, `${QUEUE_PATH}/${userId}`);
    const userMatchRef = ref(db, `${USER_MATCHES_PATH}/${userId}`);

    // Bağlantı koptuğunda kuyruğu temizle
    onDisconnect(myQueueRef).remove();

    // Kuyruğa yaz
    await set(myQueueRef, { userId, trophies, joinedAt: Date.now() });

    // Bu kullanıcıya atanan maçı dinle
    const handleMatchAssigned = (snap: DataSnapshot) => {
      const matchId: string | null = snap.val();
      if (!matchId) return;

      get(ref(db, `${MATCHES_PATH}/${matchId}`))
        .then((matchSnap) => {
          if (matchSnap.exists()) {
            onMatchFound({
              id: matchId,
              ...(matchSnap.val() as Omit<CompMatch, 'id'>),
            });
          }
        })
        .catch((err) => console.warn('[matchmaking] maç yüklenemedi:', err));
    };

    onValue(userMatchRef, handleMatchAssigned);

    // Kuyrukta biri var mı hemen kontrol et
    await tryMatchWithExisting(userId);

    // Temizlik fonksiyonu (iptal butonuna basılınca çağrılır)
    return () => {
      off(userMatchRef, 'value', handleMatchAssigned);
      remove(myQueueRef).catch(() => {});
      remove(userMatchRef).catch(() => {});
    };
  } catch (err) {
    console.error('[matchmaking] kuyruğa katılınamadı:', err);
    // Hiçbir şey temizlemeye gerek yok — sessizce başarısız ol
    return () => {};
  }
};

/**
 * Kuyrukta başka oyuncu varsa atomik transaction ile maç kur.
 * Race condition'ı önlemek için Firebase transaction kullanır.
 */
const tryMatchWithExisting = async (myUserId: string): Promise<void> => {
  try {
    const queueSnap = await get(ref(db, QUEUE_PATH));
    if (!queueSnap.exists()) return;

    const entries = Object.values(queueSnap.val()) as QueueEntry[];
    const opponents = entries
      .filter((e) => e.userId !== myUserId)
      .sort((a, b) => a.joinedAt - b.joinedAt); // en uzun bekleyeni al

    if (opponents.length === 0) return;

    const opponent = opponents[0];

    // Rakibi atomik olarak kuyruktan çıkar (başkası daha hızlı davranmış olabilir)
    const opponentQueueRef = ref(db, `${QUEUE_PATH}/${opponent.userId}`);
    let claimed = false;

    await runTransaction(opponentQueueRef, (current) => {
      if (current === null) return; // zaten alınmış, iptal et
      claimed = true;
      return null; // sil
    });

    if (!claimed) return; // rakip başkası tarafından alındı

    await createMatch(myUserId, opponent.userId);
  } catch (err) {
    console.warn('[matchmaking] eşleşme denemesi başarısız:', err);
  }
};

/** Maç dökümanını oluşturur ve her iki oyuncuya bildirir */
const createMatch = async (
  player1Id: string,
  player2Id: string
): Promise<void> => {
  const matchRef = push(ref(db, MATCHES_PATH));
  const matchId  = matchRef.key!;

  // Her iki oyuncunun da göreceği 5 ortak renk
  const colors: RGB[] = Array.from({ length: TOTAL_COMP_ROUNDS }, generateRandomColor);

  const matchData: Omit<CompMatch, 'id'> = {
    players:   [player1Id, player2Id],
    colors,
    scores:    { [player1Id]: [], [player2Id]: [] },
    status:    'active',
    createdAt: Date.now(),
  };

  await set(matchRef, matchData);

  // Her iki oyuncuya matchId bildir + oluşturanı kuyruktan çıkar
  await Promise.all([
    set(ref(db, `${USER_MATCHES_PATH}/${player1Id}`), matchId),
    set(ref(db, `${USER_MATCHES_PATH}/${player2Id}`), matchId),
    remove(ref(db, `${QUEUE_PATH}/${player1Id}`)),
  ]);
};

// ─── Maç sırasında kullanılan fonksiyonlar ────────────────────────────────────

/** Her round sonunda skor dizisini Firebase'e yazar */
export const submitRoundScores = async (
  matchId: string,
  userId:  string,
  scores:  number[]
): Promise<void> => {
  try {
    await set(ref(db, `${MATCHES_PATH}/${matchId}/scores/${userId}`), scores);
  } catch (err) {
    console.error('[matchmaking] skor gönderilemedi:', err);
  }
};

/**
 * Maç dökümanını gerçek zamanlı dinler.
 * Döndürülen fonksiyon listener'ı durdurur.
 */
export const listenToMatch = (
  matchId:  string,
  onChange: (match: CompMatch) => void
): (() => void) => {
  const matchRef = ref(db, `${MATCHES_PATH}/${matchId}`);
  const listener = (snap: DataSnapshot) => {
    if (snap.exists()) {
      onChange({ id: matchId, ...(snap.val() as Omit<CompMatch, 'id'>) });
    }
  };
  onValue(matchRef, listener);
  return () => off(matchRef, 'value', listener);
};

/** Maç bittikten sonra userMatch referansını temizler */
export const clearUserMatch = async (userId: string): Promise<void> => {
  try {
    await remove(ref(db, `${USER_MATCHES_PATH}/${userId}`));
  } catch (err) {
    console.warn('[matchmaking] temizlik başarısız:', err);
  }
};
