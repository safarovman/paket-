-- ============================================================
--  UzDrop v11 — PUL YECHISH O'CHIRILDI (10 dan keyin)
--  Saytda pul yechish yo'q: foydalanuvchilar request_withdraw ni chaqira olmaydi.
--  Qayta yoqish kerak bo'lsa:
--    grant execute on function public.request_withdraw(bigint,text) to authenticated;
-- ============================================================
revoke execute on function public.request_withdraw(bigint, text) from authenticated, anon, public;
