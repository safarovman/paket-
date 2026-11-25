# UzDrop — akkaunt sotish va akkaunt spin

Next.js 14 + Tailwind + Supabase. Sahifalar:

| Sahifa | Vazifasi |
|---|---|
| `/` | Keyslar (spin), sotuvdagi akkauntlar |
| `/case/[id]` | Ruletka, keys ichidagi akkauntlar va ehtimollar |
| `/market` | Akkauntlar bozori, balansdan sotib olish |
| `/sell` | Bozorga qo'yish yoki ⚡ Tez sotish |
| `/wallet` | Balans to'ldirish va pul yechish |
| `/profile` | Inventar (yutuqlar: sotish/olish), xaridlar, e'lonlar, tarix |
| `/admin` | So'rovlarni tasdiqlash, keyslar, akkaunt qo'shish, foydalanuvchilar |

## Ishga tushirish
1. Supabase → SQL Editor → `supabase/uzdrop.sql` ni to'liq ishga tushiring.
2. O'zingizni admin qiling (SQL oxiridagi `update public.profiles set is_admin = true ...`).
3. Env o'zgaruvchilar (Netlify/Vercel/Cloudflare):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_DEPOSIT_CARD`, `NEXT_PUBLIC_DEPOSIT_CARD_OWNER` — to'ldirish uchun karta
4. Supabase → Authentication → URL Configuration → Redirect URLs ga `https://SAYT/login/done` qo'shing.
5. `npm install && npm run build`

Barcha pul amallari Postgres funksiyalari (RPC) ichida bajariladi; spin natijasi serverda hisoblanadi,
jadvallarga to'g'ridan-to'g'ri yozish RLS bilan yopilgan.
