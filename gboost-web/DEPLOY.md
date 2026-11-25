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
   [{ "AllowedOrigins": ["https://SIZNINGDOMEN.uz", "http://localhost:3000"],
      "AllowedMethods": ["PUT"], "AllowedHeaders": ["content-type"], "MaxAgeSeconds": 3600 }]
   ```
4. R2 → **Manage API Tokens** → Create → *Object Read & Write*, faqat `uzdrop-images` bucket. Access Key ID va Secret'ni saqlang.
5. Supabase → Edge Functions → **Secrets** ga qo'shing (kalitlar faqat shu yerda turadi, saytda emas):
   `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=uzdrop-images`, `R2_PUBLIC_URL=https://img.SIZNINGDOMEN.uz`
6. Funksiyani joylang (kompyuterda Supabase CLI bilan):
   ```bash
   supabase functions deploy r2-upload --project-ref heohxnkmwodsnhzgixst
   ```

## 3. Cloudflare Pages (sayt)
1. Cloudflare → Workers & Pages → Create → **Pages** → GitHub reponi ulang (`paket-`).
2. Sozlamalar:
   - Root directory: `gboost-web`
   - Build command: `npm run build`
   - Output directory: `out`
3. Environment variables:
   | Nomi | Qiymat |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase loyiha URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon (ochiq) kalit |
   | `NEXT_PUBLIC_STORAGE` | `r2` |
   | `NEXT_PUBLIC_TELEGRAM_ADMIN` | admin Telegram username (@ siz) |
   | `NODE_VERSION` | `20` |

## 4. Domen
1. Domen sotib oling: `.com` — Cloudflare Registrar (ustama yo'q); `.uz` — mahalliy registrator (cctld.uz ro'yxatidagilar).
2. `.uz` bo'lsa: Cloudflare'ga sayt qo'shing va registratorda NS serverlarni Cloudflare beradiganlarga almashtiring.
3. Pages loyiha → **Custom domains** → `SIZNINGDOMEN.uz` va `www`.
4. Supabase → Authentication → URL Configuration:
   - Site URL: `https://SIZNINGDOMEN.uz`
   - Redirect URLs: `https://SIZNINGDOMEN.uz/login/done/`
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
