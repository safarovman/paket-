-- ============================================================
--  ESKI GBoost JADVALLARINI YOPISH (xavfsizlik)
--  Eski sxemada barcha jadvallar "using (true)" bilan HAMMAGA ochiq edi —
--  saytdagi ochiq kalit bilan istalgan odam o'qiy/o'zgartira olardi
--  (jumladan admins jadvalidagi parollar).
--  Bu skript ochiq siyosatlarni o'chiradi va anon/authenticated uchun
--  barcha huquqlarni oladi. service_role (server) ishlashda davom etadi.
--  Qayta ishga tushirish xavfsiz. Faqat mavjud jadvallarga ta'sir qiladi.
-- ============================================================
do $$
declare t text; p record;
begin
  foreach t in array array['admins','users','orders','complaints','payments','listings','deleted_admins'] loop
    if to_regclass('public.' || t) is not null then
      for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
        execute format('drop policy %I on public.%I', p.policyname, t);
      end loop;
      execute format('alter table public.%I enable row level security', t);
      execute format('revoke all on table public.%I from anon, authenticated', t);
      raise notice 'Yopildi: %', t;
    end if;
  end loop;
end $$;

-- Realtime orqali ham tarqalmasin
do $$
declare t text;
begin
  foreach t in array array['orders','listings','complaints','payments'] loop
    begin
      execute format('alter publication supabase_realtime drop table public.%I', t);
    exception when others then null;
    end;
  end loop;
end $$;

-- ESLATMA: admins jadvalidagi parollar ochiq matnda saqlangan bo'lishi mumkin.
-- Ular oldin ochiq bo'lgani uchun o'sha parollarni boshqa joyda ishlatmang va almashtiring.
-- Eski jadvallar kerak bo'lmasa, butunlay o'chirib yuborish mumkin:
--   drop table if exists public.deleted_admins, public.complaints, public.payments,
--     public.orders, public.listings, public.users, public.admins cascade;
