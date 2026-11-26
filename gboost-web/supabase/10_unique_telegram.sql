-- ============================================================
--  UzDrop v10 — TELEGRAM USERNAME NOYOB (09 dan keyin)
--  Bitta Telegram username'ni faqat bitta foydalanuvchi egallay oladi.
--  Firibgar admin yoki boshqa odamning username'ini o'z profiliga yoza olmaydi.
--  (Admin huquqi username'ga bog'liq emas — faqat is_admin belgisi, uni faqat ega beradi.)
-- ============================================================
create unique index if not exists profiles_telegram_unique
  on public.profiles (lower(telegram)) where telegram is not null;

create or replace function public.set_telegram(p_username text) returns void
language plpgsql security definer set search_path = public as $$
declare v text := lower(regexp_replace(trim(coalesce(p_username,'')), '^@', ''));
begin
  if auth.uid() is null then raise exception 'Avval tizimga kiring'; end if;
  if v !~ '^[a-z0-9_]{5,32}$' then raise exception 'Telegram username noto''g''ri (masalan: @uzdrop_user)'; end if;
  if exists (select 1 from public.profiles where lower(telegram) = v and id <> auth.uid()) then
    raise exception 'Bu Telegram username boshqa foydalanuvchiga tegishli. O''zingizning username''ingizni yozing.';
  end if;
  update public.profiles set telegram = v where id = auth.uid();
end $$;
grant execute on function public.set_telegram(text) to authenticated;
