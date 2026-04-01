# Color Match — App Store Metadata

## Temel Bilgiler

| Alan | Değer |
|------|-------|
| App Adı | Color Match |
| Bundle ID | com.colormatch.app |
| Versiyon | 1.0.0 |
| Build | 1 |
| Kategori | Oyunlar → Bulmaca |
| İkincil Kategori | Oyunlar → Kart |
| Yaş Derecelendirme | 4+ |
| Fiyat | Ücretsiz |
| Ülke/Dil | Türkiye + Worldwide |

---

## Uygulama Adı (30 karakter maks.)
```
Color Match
```

## Altyazı (30 karakter maks.)
```
RGB Renk Hafıza Oyunu
```

## Açıklama (4000 karakter maks.)
```
Rengini göster, hafızana kazı — ve RGB sliderlarla mükemmel eşleşmeyi bul!

Color Match, renk algısını ve görsel hafızayı test eden bağımlılık yapan bir bulmaca oyunudur.

🎨 NASIL OYNANIR?
• Her turda rastgele bir renk 5 saniye boyunca ekranında parlar
• Süre dolunca renk kaybolur — şimdi tahmin vakti!
• Kırmızı, Yeşil ve Mavi kanalları slider'larla ayarla
• Hedef renge ne kadar yakınsan o kadar yüksek puan

🏆 PUANLAMA SİSTEMİ
• 92+ puan → 🎯 Mükemmel!
• 82+ puan → ✨ Çok Yakın!
• 65+ puan → 👍 Fena Değil
• 45+ puan → 😐 İdare Eder

⚔️ REKABETÇI MOD
• Gerçek oyuncularla anlık eşleşme
• Kupa ve MMR sistemi
• 5 kademe: Bronz → Gümüş → Altın → Elmas → Master
• Kazanınca +25, kaybedince -15 kupa

📊 5 TUR — TAM OYUN
• 5 farklı rengi tahmin et
• Tüm turlar sonunda genel değerlendirme
• Yüksek skorunu kaydet ve geç

Renk körü müsün yoksa gizli bir renk sanatçısı mı? Şimdi keşfet!
```

## Anahtar Kelimeler (100 karakter maks., virgülle ayrılmış)
```
renk,rgb,hafıza,bulmaca,oyun,color,match,puzzle,memory,slider
```

## Destek URL
```
https://github.com/yourusername/color-match
```

## Pazarlama URL (opsiyonel)
```
(boş bırakabilirsiniz)
```

## Gizlilik Politikası URL (zorunlu)
```
https://github.com/yourusername/color-match/blob/main/PRIVACY.md
```
> NOT: Aşağıda hazır gizlilik politikası metni bulunuyor

---

## Yaş Derecelendirme Soruları
Tümünü "Yok / Hayır" seç:
- Şiddet içerik → Yok
- Cinsel içerik → Yok
- Kumar → Yok
- Gerçek para harcama → Yok
- Sosyal ağ özellikleri → Yok (sadece matchmaking)
- Konum → Yok

**Sonuç: 4+**

---

## App Store Connect Kontrol Listesi

### Build Yüklemeden Önce:
- [ ] Apple Developer hesabına giriş yap (developer.apple.com)
- [ ] App Store Connect'te uygulama oluştur (appstoreconnect.apple.com)
  - "Apps" → "+" → "New App"
  - Platform: iOS
  - Name: Color Match
  - Bundle ID: com.colormatch.app (otomatik gelir)
  - SKU: colormatch001
- [ ] `eas.json` içine appleId, ascAppId, appleTeamId ekle

### EAS Build Komutları:
```bash
# 1. Expo hesabına giriş
eas login

# 2. Projeyi Expo'ya bağla (ilk kez)
eas init

# 3. Production build başlat (Apple'a otomatik sertifika alır)
eas build --platform ios --profile production

# 4. Build hazır olunca App Store'a gönder
eas submit --platform ios --profile production
```

### Sertifika Notları:
- EAS otomatik olarak Distribution Certificate ve Provisioning Profile oluşturur
- Apple Developer hesap bilgilerini (Apple ID + Team ID) sorar
- Sertifikaları kendin oluşturman gerekmez

---

## Gizlilik Politikası (PRIVACY.md için)

Aşağıdaki metni `PRIVACY.md` dosyası olarak GitHub'a yükle:

```markdown
# Privacy Policy — Color Match

Last updated: April 2026

Color Match does not collect, store, or share any personal information.

## Data We Collect
- **Game scores**: Stored locally on your device only (AsyncStorage)
- **Matchmaking**: Temporary queue data stored in Firebase Realtime Database, deleted immediately after match

## Firebase
Competitive matchmaking uses Firebase Realtime Database. No personal identifiers
(name, email, device ID) are stored. Queue entries are anonymous and auto-deleted
on disconnect.

## Third-Party Services
- Firebase Realtime Database (Google LLC) — matchmaking only

## Contact
For questions: [your email]
```
