-- ============================================================
--  UzDrop v19 — RAMKA USLUBLARI (18 dan keyin)
--  Bezakli: '<o'yin>', oddiy neon: 'simple-<o'yin>', 'none' = ramkasiz, null = avtomatik.
-- ============================================================
alter table public.accounts drop constraint if exists accounts_frame_check;
alter table public.accounts add constraint accounts_frame_check
  check (frame is null or frame = 'none' or frame ~ '^(simple-)?(pubg|standoff2|mlbb|freefire|cs2|brawl|default)$');

create or replace function public.admin_set_frame(p_account uuid, p_frame text) returns void
language plpgsql security definer set search_path = public as $$
declare v text := nullif(trim(coalesce(p_frame, '')), '');
begin
  perform public._require_admin();
  if v is not null and v <> 'none' and v !~ '^(simple-)?(pubg|standoff2|mlbb|freefire|cs2|brawl|default)$' then
    raise exception 'Noma''lum ramka: %', v;
  end if;
  update public.accounts set frame = v, updated_at = now() where id = p_account;
  if not found then raise exception 'Akkaunt topilmadi'; end if;
end $$;
revoke execute on function public.admin_set_frame(uuid, text) from anon, public;
grant execute on function public.admin_set_frame(uuid, text) to authenticated;
