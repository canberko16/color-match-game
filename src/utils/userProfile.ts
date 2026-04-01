import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY      = '@cmatch_user_id';
const TROPHIES_KEY     = '@cmatch_trophies';
const INITIAL_TROPHIES = 500; // Yeni oyuncular Gümüş'ten başlar

/**
 * Cihaza özgü kalıcı kullanıcı ID'si döner.
 * İlk çağrıda oluşturulur ve AsyncStorage'a yazılır.
 */
export const getUserId = async (): Promise<string> => {
  let id = await AsyncStorage.getItem(USER_ID_KEY);
  if (!id) {
    // timestamp + random suffix ile benzersiz ID üret
    id = `u_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await AsyncStorage.setItem(USER_ID_KEY, id);
  }
  return id;
};

/** Mevcut kupa (trophy) sayısını döner */
export const getTrophies = async (): Promise<number> => {
  const val = await AsyncStorage.getItem(TROPHIES_KEY);
  return val ? parseInt(val, 10) : INITIAL_TROPHIES;
};

/**
 * Kupa sayısını delta kadar günceller ve yeni değeri döner.
 * Minimum değer 0'dır — negatife düşmez.
 */
export const updateTrophies = async (delta: number): Promise<number> => {
  const current = await getTrophies();
  const updated = Math.max(0, current + delta);
  await AsyncStorage.setItem(TROPHIES_KEY, updated.toString());
  return updated;
};
