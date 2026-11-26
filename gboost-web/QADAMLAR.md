# UzDrop — ishga tushirish qadamlari

Har bir qadamni bajargach, Claude'ga "N-qadam tayyor" deb yozing. Kerak bo'lsa Claude tekshiradi
va keyingisiga o'tadi. **Hech qanday parol, kalit yoki tokenni chatga yozmang** — ular faqat
Supabase / Cloudflare sozlamalariga kiritiladi.

---

## 1-qadam. Cloudflare R2 ni yoqish (5 daqiqa)
1. dash.cloudflare.com → chap menyuda **R2 Object Storage**.
2. **Purchase R2 / Enable R2** tugmasi. Cloudflare karta so'raydi — bepul limit (10 GB, oyiga 1 mln yuklash)
   ichida pul yechilmaydi.
3. Tayyor bo'lgach Claude'ga yozing — bucket'ni Claude o'zi ochadi.

## 2-qadam. Supabase bazasini tayyorlash (10 daqiqa)
1. supabase.com → loyihangiz → **SQL Editor** → **New query**.
2. `gboost-web/supabase/` papkasidagi fayllarni **tartib bilan** bittadan nusxalab, **Run** bosing:
   `01_close_old_gboost.sql` → `02_uzdrop.sql` → `03_codes.sql` → `04_account_admins.sql` →
   `05_settings.sql` → `06_admin_stats.sql` → `07_activity.sql`
3. Har birida "Success" chiqishi kerak. Xato chiqsa — xato matnini Claude'ga yuboring.

## 3-qadam. Saytni Cloudflare Pages'ga joylash (15 daqiqa)
1. Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → `paket-` reposi.
2. **Asosiy sayt**: nomi `uzdrop`, branch `claude/upbeat-planck-rfg1qo` (yoki main ga birlashtirgach `main`),
   Root directory `gboost-web`, Build command `npm run build`, Output `out`.
3. Environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = Supabase → Settings → API → Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = shu sahifadagi **anon public** kalit (bu ochiq kalit, xavfsiz)
   - `NEXT_PUBLIC_TELEGRAM_ADMIN` = asosiy admin Telegram username (@ siz)
   - `NODE_VERSION` = `20`
4. Yana bitta Pages loyiha — **admin sayti**: nomi o'zingiz biladigan nom (masalan `uzd-panel-x7`),
   Build command `npm run build:admin`, Output `out-admin`, env'lar xuddi shunday.
5. Ikkala saytning `*.pages.dev` manzillarini Claude'ga yozing.

## 4-qadam. Kirishni sozlash
1. Supabase → **Authentication → URL Configuration**:
   Site URL = asosiy sayt manzili; Redirect URLs ga ikkala saytning `/login/done/` manzilini qo'shing.
2. Saytda ro'yxatdan o'ting. Keyin SQL Editor'da (emailni o'zingiznikiga almashtiring):
   ```sql
   update public.profiles set is_owner = true, is_admin = true
    where id = (select id from auth.users where email = 'SIZNING@EMAIL');
   ```
3. Saytda Profil → Telegram username'ingizni yozing.
4. **Gmail SMTP**: Google Account → Security → 2-bosqichli tekshiruvni yoqing → **App passwords** → "UzDrop".
   Supabase → Authentication → **SMTP Settings**: host `smtp.gmail.com`, port `465`, user = gmail, parol = app password.
5. **Google orqali kirish**: AUTH.md dagi "Google" bo'limi.

## 5-qadam. Telegram bot (xabarnomalar va Telegram orqali kirish)
1. Telegram → @BotFather → `/newbot` → nom va username bering. Token beriladi (**chatga yozmang**).
2. O'z chat ID'ingiz: botingizga `/start` yozing, keyin @userinfobot dan ID'ingizni oling.
3. Supabase → **Edge Functions → Secrets** (Manage secrets):
   - `TELEGRAM_BOT_TOKEN` = bot tokeni
   - `TELEGRAM_ADMIN_CHAT_IDS` = sizning chat ID (bir nechta admin bo'lsa vergul bilan)
   - `NOTIFY_WEBHOOK_SECRET` = o'zingiz o'ylab topgan uzun tasodifiy so'z (masalan 30 ta harf-raqam)
4. Edge funksiyalarni joylash — kompyuteringizda bir marta:
   ```bash
   npx supabase login
   npx supabase functions deploy notify-admin --no-verify-jwt --project-ref acwlvsazpqjnunqbaxyx
   npx supabase functions deploy telegram-auth --no-verify-jwt --project-ref acwlvsazpqjnunqbaxyx
   npx supabase functions deploy r2-upload --project-ref acwlvsazpqjnunqbaxyx
   ```
5. Supabase → **Database → Webhooks** → Create:
   - Table: `transactions`, Events: **Insert**
   - Type: Supabase Edge Function → `notify-admin`
   - HTTP Headers: `x-webhook-secret` = 3-banddagi `NOTIFY_WEBHOOK_SECRET` qiymati
   Shundan keyin har bir xarid / to'ldirish / yechish Telegramingizga keladi.

## 6-qadam. R2 kalitlari (1-qadamdan keyin)
1. Cloudflare → R2 → **Manage API Tokens** → Create → *Object Read & Write*, faqat `uzdrop-images` bucket.
2. Supabase Secrets ga: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=uzdrop-images`,
   `R2_PUBLIC_URL` (bucket → Settings → Public Development URL ni yoqing va shu manzil).
3. Bucket → Settings → **CORS policy** (DEPLOY.md dagi JSON).

## 7-qadam. Domen (keyinroq)
`uzdrop.uz` (yoki `.com`) sotib oling → Cloudflare'ga ulang → Pages → Custom domains.
Domen bo'lgach: BotFather'da `/setdomain` (Telegram orqali kirish shunda ishlaydi) va Supabase Redirect URLs yangilanadi.
