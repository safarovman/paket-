# UzDrop — kirish usullarini sozlash (Google, email kod, Telegram)

Saytda 4 xil kirish bor: **Google**, **Telegram**, **email + parol**, **email kod (OTP)**.
Hammasi Supabase Auth orqali ishlaydi. Quyidagilarni bir marta sozlaysiz.

---

## 1. Google orqali kirish
1. https://console.cloud.google.com → yangi loyiha (masalan `UzDrop`).
2. **APIs & Services → OAuth consent screen** → External → ilova nomi `UzDrop`, email, logotip (ixtiyoriy) → saqlang.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs: `https://heohxnkmwodsnhzgixst.supabase.co/auth/v1/callback`
4. Chiqqan **Client ID** va **Client Secret**ni nusxalang.
5. Supabase → **Authentication → Sign In / Providers → Google** → yoqing, Client ID va Secret'ni joylang → Save.
6. Supabase → **Authentication → URL Configuration**:
   - **Site URL**: `https://uzdrop.uz` (domen olingach; hozircha Cloudflare Pages manzili)
   - **Redirect URLs** (har birini qo'shing):
     - `https://uzdrop.uz/login/done/`
     - `https://admin.uzdrop.uz/login/done/`
     - `https://<loyiha>.pages.dev/login/done/` (vaqtinchalik manzillar)
     - `http://localhost:3000/login/done/` va `http://localhost:3001/login/done/`

## 2. Email kod va tasdiqlash xatlari
Supabase'ning o'zining pochta yuboruvchisi **soatiga bir necha xat** bilan cheklangan — haqiqiy sayt uchun yetmaydi.
O'z SMTP'ingizni ulang:

**Variant A — Resend (tavsiya, bepul: oyiga 3 000 xat)**
1. https://resend.com → ro'yxatdan o'ting → **Domains** → domeningizni qo'shing va DNS yozuvlarini (Cloudflare'da) kiriting.
2. **API Keys** → yangi kalit.
3. Supabase → **Authentication → Emails → SMTP Settings** → Enable custom SMTP:
   - Host `smtp.resend.com`, Port `465`, Username `resend`, Password = API kalit
   - Sender email `no-reply@uzdrop.uz`, Sender name `UzDrop`

**Variant B — Gmail (domen bo'lmasa, kichik hajm uchun)**
1. Google akkauntda 2 bosqichli himoyani yoqing → **App passwords** → yangi parol oling.
2. SMTP: Host `smtp.gmail.com`, Port `465`, Username = Gmail manzilingiz, Password = app password.
   (Gmail kuniga ~500 xatgacha yuboradi.)

**Xat matnini o'zbekchalashtirish:** Supabase → Authentication → Emails → Templates → **Magic Link / OTP**:
```html
<h2>UzDrop — kirish kodi</h2>
<p>Sizning kodingiz: <b style="font-size:24px">{{ .Token }}</b></p>
<p>Kod 1 soat amal qiladi. Agar siz so'ramagan bo'lsangiz — bu xatni e'tiborsiz qoldiring.</p>
```
**Confirm signup** shablonini ham shunga o'xshash o'zbekcha qiling.

## 3. Telegram orqali kirish
> Telegram vidjeti faqat **haqiqiy domenda** ishlaydi (localhost'da ishlamaydi). Domen olingach sozlang.

1. Telegramda **@BotFather** → `/newbot` → nom `UzDrop`, username masalan `uzdrop_login_bot`.
2. BotFather bergan **tokenni hech kimga bermang va chatga yozmang.**
3. BotFather → `/setdomain` → botni tanlang → `uzdrop.uz` (admin saytida ham kerak bo'lsa alohida bot yoki asosiy domen).
4. Supabase → **Edge Functions → Secrets** → `TELEGRAM_BOT_TOKEN` = bot tokeni.
   (Hech qachon `NEXT_PUBLIC_...` ga yozmang — u saytda hammaga ko'rinadi.)
5. Funksiyani joylang (kompyuteringizda Supabase CLI bilan):
   ```bash
   supabase functions deploy telegram-auth --no-verify-jwt --project-ref heohxnkmwodsnhzgixst
   ```
   `--no-verify-jwt` kerak — foydalanuvchi hali tizimga kirmagan bo'ladi; xavfsizlikni funksiya o'zi
   Telegram imzosini bot tokeni bilan tekshirib ta'minlaydi.
6. Cloudflare Pages → Environment variables → `NEXT_PUBLIC_TELEGRAM_BOT` = bot username (`@`siz), keyin saytni qayta yig'ing.

Telegram orqali kirgan foydalanuvchining @username'i profilga avtomatik yoziladi — admin uni tekshirishi oson bo'ladi.
Sozlanmaguncha saytda "Telegram orqali (tez kunda)" tugmasi ko'rinadi.

## 4. Telefon raqamiga SMS (ixtiyoriy, keyinroq)
Telefon raqam bilan kirish uchun pullik SMS provayder kerak (Twilio yoki O'zbekistonda **Eskiz.uz**).
Hozircha Google, Telegram va email yetarli.
