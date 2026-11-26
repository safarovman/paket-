-- ============================================================
--  UzDrop v9 — JADVAL RUXSATLARI (08 dan keyin)
--  Yangi Supabase loyihalarida jadvallarga ruxsat avtomatik berilmaydi.
--  Sayt jadvallarni faqat O'QIYDI (qaysi qatorni ko'rishini RLS hal qiladi);
--  yozish faqat himoyalangan RPC funksiyalar orqali.
-- ============================================================
grant usage on schema public to anon, authenticated;

-- Keraksiz huquqlarni olib tashlash (faqat SELECT qoladi)
revoke insert, update, delete, truncate, references, trigger on
  public.profiles, public.cases, public.accounts, public.account_secrets, public.spins,
  public.transactions, public.deposits, public.withdrawals, public.deliveries, public.site_settings
  from anon, authenticated;

-- Tizimga kirgan foydalanuvchi: o'qish (RLS: faqat o'ziniki / ochiq qatorlar)
grant select on
  public.profiles, public.cases, public.accounts, public.account_secrets, public.spins,
  public.transactions, public.deposits, public.withdrawals, public.deliveries, public.site_settings
  to authenticated;

-- Mehmon (kirmagan): faqat ochiq ma'lumotlar — sotuvdagi akkauntlar, keyslar, sozlamalar
grant select on public.cases, public.accounts, public.spins, public.site_settings to anon;
revoke select on public.profiles, public.account_secrets, public.transactions, public.deposits,
  public.withdrawals, public.deliveries from anon;

-- Trigger funksiyalarini to'g'ridan-to'g'ri chaqirib bo'lmasin
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public._set_account_admin() from anon, authenticated, public;
