# GBoost Web — Next.js Sayt

> O'zbekistonning birinchi xavfsiz geyming ekotizimi

**Sayt:** [Vercel'ga deploy qilingan](https://gboost-web.vercel.app)

## Sahifalar

| Sahifa | URL | Tavsif |
|--------|-----|--------|
| Landing | `/` | Hero, muammo/yechim, o'yinlar, Escrow, CTA |
| Login | `/login` | Telefon + Telegram login |
| Register | `/register` | 2 bosqich — Mijoz/Booster rol |
| Dashboard | `/dashboard` | Statistika, buyurtmalar, tezkor harakatlar |
| Boosting | `/boosting` | 4 bosqich wizard — o'yin, xizmat, rank, to'lov |
| Marketplace | `/marketplace` | Akkaunt bozori + modal detail |
| Escrow | `/escrow` | Approve/Dispute + "Qanday ishlaydi" |
| Karma | `/karma` | AI moduli, progress circle, jazo tizimi |
| Profile | `/profile` | Foydalanuvchi profili, tahrirlash |

## Ishga tushirish

```bash
cd gboost-web
npm install
npm run dev
```

## Vercel Deploy

```bash
npm install -g vercel
vercel --prod
```

## Texnologiyalar

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Vercel** (hosting)
