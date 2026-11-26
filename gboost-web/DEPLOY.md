# UzDrop — ishga tushirish (Cloudflare Pages + R2 + Supabase + domen)

Hammasi bepul: **Cloudflare Pages** (sayt, trafik cheksiz), **Cloudflare R2** (rasmlar, 10 GB, trafik bepul),
**Supabase** (baza, kirish, balans). Faqat domen pullik (~$10/yil `.com`, `.uz` — mahalliy registratorda).

## 1. Supabase (baza)
1. SQL Editor'da tartib bilan ishga tushiring:
   1. `supabase/01_close_old_gboost.sql` — eski ochiq jadvallarni yopadi
   2. `supabase/02_uzdrop.sql` — asosiy sxema
   3. `supabase/03_codes.sql` — kod orqali topshirish
   4. `supabase/04_account_admins.sql` — akkaunt ID (#1001…) va mas'ul admin
   5. `supabase/05_settings.sql` — to'lov kartasi sozlamasi (admin panel → ⚙️ Sozlamalar)
   6. `supabase/06_admin_stats.sql` — statistika va Telegram orqali qo'lda to'ldirish
2. Saytda ro'yxatdan o'ting, keyin o'zingizni **ega** qiling (o'z emailingiz bilan):
   ```sql
   update public.profiles set is_owner = true, is_admin = true
    where id = (select id from auth.users where email = 'SIZNING@EMAIL');
   ```
   To'lov kartasini admin panel → **⚙️ Sozlamalar**da kiriting (faqat ega o'zgartira oladi; karta bloklansa shu yerda to'xtatib, yangisiga almashtirasiz).
   Boshqa adminlarni keyin admin panel → Foydalanuvchilar → "Admin qilish" orqali tayinlaysiz (faqat ega qila oladi).
   **Har bir admin profil sahifasida Telegram username'ini yozishi shart** — xaridorlar aynan shu adminga yo'naltiriladi.
3. **Admin akkauntga kuchli, boshqa joyda ishlatilmagan parol qo'ying.**

## 2. Cloudflare R2 (rasmlar)
1. Cloudflare → R2 → **Create bucket** → nom: `uzdrop-images`.
2. Bucket → Settings → **Custom Domains** → `img.SIZNINGDOMEN.uz` ulang (domen Cloudflare'da bo'lishi kerak).
   Domen hali bo'lmasa: **Public Development URL** ni yoqing (`https://pub-....r2.dev`).
3. Bucket → Settings → **CORS policy**:
   ```json
   [{ "AllowedOrigins": ["https://admin.SIZNINGDOMEN.uz", "https://uzdrop-admin.pages.dev", "http://localhost:3001"],
      "AllowedMethods": ["PUT"], "AllowedHeaders": ["content-type"], "MaxAgeSeconds": 3600 }]
   ```
4. R2 → **Manage API Tokens** → Create → *Object Read & Write*, faqat `uzdrop-images` bucket. Access Key ID va Secret'ni saqlang.
5. R2 sozlanmaguncha rasmlar avtomatik Supabase Storage'ga yuklanadi (1 GB). R2 tayyor bo'lgach o'zi R2'ga o'tadi.
6. Supabase → Edge Functions → **Secrets** ga qo'shing (kalitlar faqat shu yerda turadi, saytda emas):
   `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=uzdrop-images`, `R2_PUBLIC_URL=https://img.SIZNINGDOMEN.uz`
7. Funksiyani joylang (kompyuterda Supabase CLI bilan):
   ```bash
   supabase functions deploy r2-upload --project-ref heohxnkmwodsnhzgixst
   ```

## 3. Cloudflare Pages — IKKI sayt (bitta repodan)
Cloudflare → Workers & Pages → Create → **Pages** → GitHub reponi ulang. Ikki marta qiling:

| | Asosiy sayt (`uzdrop`) | Admin sayti (`uzdrop-admin`) |
|---|---|---|
| Root directory | `gboost-web` | `gboost-web` |
| Build command | `npm run build` | `npm run build:admin` |
| Output directory | `out` | `out-admin` |
| Domen (keyin) | `uzdrop.uz` | `admin.uzdrop.uz` (yoki boshqa, sir saqlangan nom) |

Ikkalasiga bir xil environment variables:
| Nomi | Qiymat |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase loyiha URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon (ochiq) kalit |
| `NEXT_PUBLIC_TELEGRAM_ADMIN` | asosiy admin Telegram username (@ siz) |
| `NEXT_PUBLIC_TELEGRAM_BOT` | Telegram login bot username (AUTH.md) |
| `NODE_VERSION` | `20` |

Admin panel kodi asosiy saytga **umuman kirmaydi** (alohida yig'iladi). Admin saytga faqat `is_admin` bo'lganlar kira oladi —
bu bazada tekshiriladi, shuning uchun manzil oshkor bo'lsa ham boshqalar hech narsa qila olmaydi.
Akkaunt spin hozircha o'chiq ("Tez kunda"); yoqish uchun asosiy saytga `NEXT_PUBLIC_SPIN=1` qo'shasiz.

Kirish (Google, Telegram, email kod) sozlamalari: **[AUTH.md](AUTH.md)**.

## 4. Domen
1. Domen sotib oling: `.com` — Cloudflare Registrar (ustama yo'q); `.uz` — mahalliy registrator (cctld.uz ro'yxatidagilar).
2. `.uz` bo'lsa: Cloudflare'ga sayt qo'shing va registratorda NS serverlarni Cloudflare beradiganlarga almashtiring.
3. Pages loyiha → **Custom domains** → `SIZNINGDOMEN.uz` va `www`.
4. Supabase → Authentication → URL Configuration:
   - Site URL: `https://SIZNINGDOMEN.uz`
   - Redirect URLs: `https://SIZNINGDOMEN.uz/login/done/` va `https://admin.SIZNINGDOMEN.uz/login/done/`
5. Google kirish ishlatilsa: Google Cloud Console'da ham shu domenni qo'shing.

## Xavfsizlik — qanday ishlaydi
- Login/parollar **faqat admin** ko'radi (bazada RLS). Sayt foydalanuvchiga hech qachon ko'rsatmaydi.
- Har bir akkauntning **ID raqami** bor (`#1024`) va u **mas'ul adminga** biriktirilgan (uni joylagan admin).
- Xarid / spin → xaridorga **akkaunt ID + maxfiy kod** (`UZ-XXXX-XXXX`) va **mas'ul adminning @telegram'i** beriladi.
  To'ldirish → `PAY-XXXX-XXXX` kodi, asosiy admin (`NEXT_PUBLIC_TELEGRAM_ADMIN`).
- Xaridor aynan o'sha adminga yozadi → admin panel → **🔑 Kod** → kod yoki `#1024` kiritiladi →
  xaridorning UzDrop ID va @username'i ko'rinadi. **Kod mos kelsa va Telegramdagi yozuvchi o'sha odam bo'lsa**
  login/parol beriladi va "Topshirildi" bosiladi. Akkaunt ID hammaga ko'rinadi — shuning uchun maxfiy kodsiz bermang.
- Sotuvchiga pul faqat "Topshirildi"dan keyin tushadi. Muammo bo'lsa "Bekor qilish" — xaridorga pul qaytadi.
- Foydalanuvchilar akkaunt va rasm qo'sha olmaydi — faqat admin (Telegramda kelishilgandan so'ng).
- R2 kalitlari Supabase Secrets'da; rasm yuklash havolasini faqat admin oladi, 5 daqiqa amal qiladi.
