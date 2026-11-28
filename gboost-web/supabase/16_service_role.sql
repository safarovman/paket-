-- ============================================================
--  UzDrop v16 — SERVER FUNKSIYALARI UCHUN MINIMAL RUXSAT (15 dan keyin)
--  Yangi Supabase loyihalarida service_role ham jadvallarga avtomatik ruxsat olmaydi.
--  notify-admin: tranzaksiyani o'qish va "xabar berildi" belgisini qo'yish.
--  telegram-auth: profilga Telegram username yozish.
-- ============================================================
grant usage on schema public to service_role;
grant select on public.transactions, public.profiles to service_role;
grant update (notified_at) on public.transactions to service_role;
grant update (telegram) on public.profiles to service_role;
