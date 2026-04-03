/**
 * Ödüllü Reklam Servisi — Soyut arayüz
 *
 * Şu an stub implementasyon (her zaman true döner, 1.5s gecikme ile).
 * Gerçek reklam SDK'sı (AdMob, ironSource vb.) entegre edildiğinde
 * sadece bu dosyadaki implementasyon değiştirilecek.
 */

export interface AdService {
  /** Reklam SDK'sı hazır mı? */
  isAvailable(): boolean;
  /** Ödüllü reklam göster. true = ödül verildi, false = iptal/hata */
  showRewardedAd(): Promise<boolean>;
}

class StubAdService implements AdService {
  isAvailable(): boolean {
    return true;
  }

  async showRewardedAd(): Promise<boolean> {
    // Gerçek reklam simülasyonu — 1.5 saniye bekle
    return new Promise((resolve) => setTimeout(() => resolve(true), 1500));
  }
}

/** Singleton reklam servisi */
export const adService: AdService = new StubAdService();
