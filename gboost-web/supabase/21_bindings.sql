-- ============================================================
--  UzDrop v21 — ULANGAN PRIVYAZKALAR (20 dan keyin)
--  bindings: {"gmail": 1, "facebook": 2, ...} — har bir platformadan nechta ulangan
--  origin:   akkaunt asli nimada ochilgan ("gmail", "facebook", "guest", ...)
--  Admin to'ldiradi, foydalanuvchilar akkaunt oynasida ko'radi.
-- ============================================================
alter table public.accounts add column if not exists bindings jsonb not null default '{}'::jsonb;
alter table public.accounts add column if not exists origin text;

create or replace function public.admin_set_bindings(p_account uuid, p_bindings jsonb, p_origin text) returns void
language plpgsql security definer set search_path = public as $$
declare k text; v jsonb; clean jsonb := '{}'::jsonb;
begin
  perform public._require_admin();
  for k, v in select * from jsonb_each(coalesce(p_bindings, '{}'::jsonb)) loop
    if k !~ '^[a-z_]{2,20}$' then raise exception 'Noto''g''ri platforma: %', k; end if;
    if jsonb_typeof(v) <> 'number' or (v::text)::int < 0 or (v::text)::int > 20 then raise exception 'Noto''g''ri son: %', k; end if;
    if (v::text)::int > 0 then clean := clean || jsonb_build_object(k, (v::text)::int); end if;
  end loop;
  update public.accounts set bindings = clean,
    origin = case when coalesce(trim(p_origin), '') ~ '^[a-z_]{2,20}$' then trim(p_origin) else null end,
    updated_at = now()
  where id = p_account;
  if not found then raise exception 'Akkaunt topilmadi'; end if;
end $$;
revoke execute on function public.admin_set_bindings(uuid, jsonb, text) from anon, public;
grant execute on function public.admin_set_bindings(uuid, jsonb, text) to authenticated;
