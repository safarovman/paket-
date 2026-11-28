-- ============================================================
--  UzDrop v18 — AKKAUNT RAMKASI (17 dan keyin)
--  Admin har bir akkauntga ramka tanlaydi: null = o'yin bo'yicha avtomatik,
--  'none' = ramkasiz, yoki aniq ramka nomi.
-- ============================================================
alter table public.accounts add column if not exists frame text;
alter table public.accounts drop constraint if exists accounts_frame_check;
alter table public.accounts add constraint accounts_frame_check
  check (frame is null or frame in ('pubg','standoff2','mlbb','freefire','cs2','brawl','default','none'));

create or replace function public.admin_set_frame(p_account uuid, p_frame text) returns void
language plpgsql security definer set search_path = public as $$
declare v text := nullif(trim(coalesce(p_frame, '')), '');
begin
  perform public._require_admin();
  if v is not null and v not in ('pubg','standoff2','mlbb','freefire','cs2','brawl','default','none') then
    raise exception 'Noma''lum ramka: %', v;
  end if;
  update public.accounts set frame = v, updated_at = now() where id = p_account;
  if not found then raise exception 'Akkaunt topilmadi'; end if;
end $$;
revoke execute on function public.admin_set_frame(uuid, text) from anon, public;
grant execute on function public.admin_set_frame(uuid, text) to authenticated;
