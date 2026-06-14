# GBoost — O'zbekistonning Birinchi Xavfsiz Geyming Ekotizimi

> **"Reytingni Ko'tar. Xavfsiz O'yna. Ishonchli Klon."**

---

## 📱 Ilova haqida

GBoost — O'zbek geymerlari uchun maxsus yaratilgan platforma bo'lib, quyidagi muammolarni hal qiladi:

| Muammo | GBoost Yechimi |
|--------|---------------|
| Telegram firibgarliklari (70%+) | ✅ 3 kunlik Escrow tizimi |
| Ishonchli booster topish imkonsiz | ✅ AI Karma moduli |
| Xalqaro saytlar (FunPay va h.k.) ishlamaydi | ✅ Uzcard/Humo/Click/Payme |
| O'zbek tili yo'q | ✅ To'liq O'zbek tili |

---

## 🎮 Qo'llab-quvvatlanadigan O'yinlar

| O'yin | Icon | Xizmatlar |
|-------|------|-----------|
| Mobile Legends: Bang Bang | 🗡️ | Solo & Duo Boosting |
| PUBG Mobile | 🎯 | Solo & Duo Boosting |
| Free Fire | 🔥 | Solo Boosting |
| Counter-Strike 2 | 💣 | Duo Boosting |

---

## 🏗️ Loyiha Strukturasi

```
gboost_app/
├── lib/
│   ├── main.dart                    # Asosiy kirish nuqtasi
│   ├── constants/
│   │   ├── app_colors.dart          # Ranglar paleti
│   │   ├── app_text_styles.dart     # Matn stillari
│   │   ├── app_constants.dart       # O'yinlar, narxlar, karma
│   │   └── app_theme.dart           # Material dark tema
│   ├── routes/
│   │   └── app_routes.dart          # Routing + MainNavScreen + BottomNav
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── splash_screen.dart   # Kirish animatsiyasi
│   │   │   ├── login_screen.dart    # Login (telefon + Telegram)
│   │   │   └── register_screen.dart # Ro'yxat (Mijoz / Booster rol)
│   │   ├── home/
│   │   │   └── home_screen.dart     # Dashboard
│   │   ├── boosting/
│   │   │   ├── boosting_screen.dart      # O'yin & xizmat tanlash
│   │   │   ├── order_form_screen.dart    # Rank + narx kalkulyator
│   │   │   └── order_confirm_screen.dart # Tasdiqlash + muvaffaqiyat
│   │   ├── booster/
│   │   │   └── booster_profile_screen.dart # Profil, statistika, sharhlar
│   │   ├── marketplace/
│   │   │   └── marketplace_screen.dart  # Akkaunt bozori
│   │   ├── escrow/
│   │   │   └── escrow_screen.dart       # Escrow tizimi
│   │   ├── karma/
│   │   │   └── karma_screen.dart        # Karma & jazo moduli
│   │   └── profile/
│   │       └── profile_screen.dart      # Foydalanuvchi profili
│   └── widgets/
│       ├── gboost_button.dart      # Asosiy tugmalar
│       ├── gboost_text_field.dart  # Matn kiritish
│       └── gboost_card.dart        # Kartalar + KarmaBadge
└── assets/
    ├── images/
    └── icons/
```

---

## 🚀 Ishga tushirish

### Talablar
- Flutter SDK `>=3.0.0`
- Dart SDK `>=3.0.0`
- Android Studio / VS Code

### O'rnatish

```bash
# 1. Reponi clone qilish
git clone https://github.com/safarovman/paket-
cd paket-/gboost_app

# 2. Paketlarni o'rnatish
flutter pub get

# 3. Ilovani ishga tushirish
flutter run

# 4. Release build (Android)
flutter build apk --release

# 5. Release build (iOS)
flutter build ios --release
```

---

## 🎨 Dizayn Tizimi

### Ranglar
| Rang | Hex | Ishlatilishi |
|------|-----|-------------|
| Background | `#0D0D1A` | Asosiy fon |
| Card | `#161D38` | Karta fonlari |
| Cyan | `#00E5FF` | Asosiy rang, aksentlar |
| Purple | `#6C3FB5` | Ikkinchi rang |
| Gold | `#FFD600` | Narxlar, yutuqlar |
| Green | `#00C853` | Muvaffaqiyat, Escrow |
| Red | `#FF3D3D` | Xatoliklar, ban |

### Tipografiya
- Asosiy font: `Calibri`
- Sarlavhalar: `Bold, 18-28px`
- Matn: `Regular, 12-15px`

---

## 💰 Biznes Model

| Daromad Turi | Ulush | Tavsif |
|-------------|-------|--------|
| Komissiya | ~60% | Har bir tranzaksiyadan 12-15% |
| VIP Obuna | ~25% | Sotuvchilar uchun $5-15/oy |
| B2B Reklama | ~15% | Geyming brendlar bannerlari |

---

## 🛡️ Escrow Tizimi

```
Xaridor to'laydi
       ↓
  Pul qulflangadi (GBoost hamyon)
       ↓
  Booster xizmat bajaradi
       ↓
  3 kun tekshiruv muddati
       ↓
  ✅ Muammo yo'q → Pul sotuvchiga
  ⚠️ Muammo bor → Moderator + pul qaytariladi
```

---

## ⭐ Karma Tizimi

| Daraja | Ball | Imtiyozlar |
|--------|------|-----------|
| Yuqori | 80-100 | Prioritet buyurtmalar, past komissiya |
| O'rtacha | 40-79 | Standart imkoniyatlar |
| Past | 0-39 | Cheklov, ban xavfi |

### Jazo bosqichlari
1. **Ogohlantirish** → Karma -5
2. **Soft Ban** (7-30 kun) → Karma -20
3. **Hard Ban** (umrbod) → Akkaunt muzlatiladi

---

## 📊 Bozor Ko'rsatkichlari

| Ko'rsatkich | Qiymat |
|-------------|--------|
| TAM (Markaziy Osiyo) | $180M |
| SAM (O'zbekiston mobil) | $45M |
| SOM (Maqsad auditoriya) | $6M |
| O'zbek geymerlari | 4.5M+ |
| Faol MLBB/PUBG foydalanuvchilar | 2.1M+ |

---

## 🗺️ Yo'l Xaritasi

| Bosqich | Muddat | Maqsad |
|---------|--------|--------|
| Telegram Mini App (MVP) | 1-3 oy | 100+ beta, $2K/oy |
| iOS/Android Ilova | 4-7 oy | Akkaunt bozori, $15K/oy |
| Markaziy Osiyo | 8-12 oy | Qozog'iston, Qirg'iziston, $50K+/oy |

---

## 📬 Aloqa

| Kanal | Ma'lumot |
|-------|---------|
| Email | gboost.uz@gmail.com |
| Telegram | @gboost_uz |
| Website | gboost.uz |

---

## 💼 Investitsiya Taklifi

- **So'ralayotgan**: $75,000 (Seed Round)
- **Taqsimot**: Dasturlash 50% · Marketing 30% · Operatsion 20%
- **ROI**: 3x (18 oyda)
- **Aktsiya ulushi**: 12% (muzokaraga ochiq)
- **Keyingi raund**: Series A $500K (24 oy)

---

*GBoost — O'zbekiston geyming bozorini o'zgartiramiz! 🎮*
