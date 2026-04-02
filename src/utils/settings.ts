import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@color_match_settings';

export interface AppSettings {
  hapticsEnabled: boolean;
  soundEnabled:   boolean;
}

const DEFAULTS: AppSettings = {
  hapticsEnabled: true,
  soundEnabled:   false,
};

// In-memory cache — initSettings() ile AsyncStorage'dan yüklenir
// Senkron erişim sağlar, her haptic çağrısında async beklemeye gerek kalmaz
let _cache: AppSettings = { ...DEFAULTS };

/** Uygulama başlangıcında bir kez çağrılır */
export const initSettings = async (): Promise<void> => {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) _cache = { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    // defaults ile devam
  }
};

/** Cache'den senkron okur */
export const getSettings = (): AppSettings => ({ ..._cache });

/** Tek bir ayarı günceller */
export const updateSetting = async <K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> => {
  _cache = { ..._cache, [key]: value };
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(_cache));
  } catch {
    // ignore
  }
};

/** Haptic tetiklemeden önce izin kontrolü */
export const isHapticsEnabled = (): boolean => _cache.hapticsEnabled;
