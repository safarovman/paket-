-- ============================================================
--  UzDrop v14 — BAN TIZIMI (13 dan keyin)
--  1) Akkaunt bani: kirish taqiqlanadi (auth.users.banned_until), seanslar o'chiriladi,
--     xarid / to'ldirish / tranzaksiya bloklanadi.
--  2) IP bani: shu IP dan xarid / to'ldirish bloklanadi, saytda "bloklangan" oynasi.
--  Faqat admin; egani hech kim, adminni faqat ega bloklay oladi.
-- ============================================================
alter table public.profiles add column if not exists is_banned  boolean not null default false;
alter table public.profiles add column if not exists ban_reason text;
alter table public.profiles add column if not exists banned_at  timestamptz;
alter table public.profiles add column if not exists last_ip    text;

create table if not exists public.banned_ips (
  ip          text primary key,
  reason      text,
  created_at  timestamptz not null default now(),
  created_by  uuid references public.profiles(id) on delete set null
);
alter table public.banned_ips enable row level security;
drop policy if exists "banned ips admin" on public.banned_ips;
create policy "banned ips admin" on public.banned_ips for select using (public.is_admin());
revoke all on public.banned_ips from anon, authenticated;
grant select on public.banned_ips to authenticated;

-- So'rov yuborgan mijozning IP manzili (Cloudflare / proxy sarlavhalaridan)
create or replace function public._client_ip() returns text
language plpgsql stable as $$
declare h json;
begin
  begin h := current_setting('request.headers', true)::json; exception when others then return null; end;
  if h is null then return null; end if;
  return nullif(trim(coalesce(h->>'cf-connecting-ip', split_part(h->>'x-forwarded-for', ',', 1), h->>'x-real-ip')), '');
end $$;

create or replace function public._is_ip_banned(p_ip text) returns boolean
language sql stable security definer set search_path = public as $$
  select p_ip is not null and exists (select 1 from public.banned_ips where ip = p_ip)
$$;

-- Sayt har ochilganda chaqiradi: ban holati + oxirgi IP ni saqlash
create or replace function public.ban_status() returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_ip text := public._client_ip(); p public.profiles; ipb public.banned_ips;
begin
  if auth.uid() is not null then
    update public.profiles set last_ip = coalesce(v_ip, last_ip) where id = auth.uid() returning * into p;
  end if;
  select * into ipb from public.banned_ips where ip = v_ip;
  if p.is_banned then
    return jsonb_build_object('banned', true, 'kind', 'account', 'reason', p.ban_reason);
  elsif ipb.ip is not null then
    return jsonb_build_object('banned', true, 'kind', 'ip', 'reason', ipb.reason);
  end if;
  return jsonb_build_object('banned', false);
end $$;
grant execute on function public.ban_status() to anon, authenticated;

-- Foydalanuvchi o'zi boshlagan amallarni ban bo'lsa to'xtatish (admin amallari bunga tushmaydi)
create or replace function public._block_banned() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and new.user_id = auth.uid() then
    if exists (select 1 from public.profiles where id = auth.uid() and is_banned) then
      raise exception 'Hisobingiz bloklangan. Savollar bo''yicha admin bilan bog''laning.';
    end if;
    if public._is_ip_banned(public._client_ip()) then
      raise exception 'Sizning tarmog''ingiz (IP) bloklangan.';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public._block_banned() from anon, authenticated, public;

drop trigger if exists transactions_block_banned on public.transactions;
create trigger transactions_block_banned before insert on public.transactions
  for each row execute function public._block_banned();
drop trigger if exists deposits_block_banned on public.deposits;
create trigger deposits_block_banned before insert on public.deposits
  for each row execute function public._block_banned();
drop trigger if exists deliveries_block_banned on public.deliveries;
create trigger deliveries_block_banned before insert on public.deliveries
  for each row execute function public._block_banned();

-- Foydalanuvchining so'nggi IP manzili (profil yoki oxirgi seans)
create or replace function public._user_ip(p_user uuid) returns text
language sql stable security definer set search_path = public, auth as $$
  select coalesce(
    (select last_ip from public.profiles where id = p_user),
    (select host(ip) from auth.sessions where user_id = p_user and ip is not null order by updated_at desc nulls last limit 1))
$$;
revoke execute on function public._user_ip(uuid) from anon, authenticated, public;

-- ---------- Admin: akkauntni bloklash ----------
create or replace function public.admin_ban_user(p_public_id bigint, p_reason text, p_ban_ip boolean)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare p public.profiles; v_ip text;
begin
  perform public._require_admin();
  select * into p from public.profiles where public_id = p_public_id;
  if p.id is null then raise exception 'ID % topilmadi', p_public_id; end if;
  if p.id = auth.uid() then raise exception 'O''zingizni bloklay olmaysiz'; end if;
  if p.is_owner then raise exception 'Sayt egasini bloklab bo''lmaydi'; end if;
  if p.is_admin and not public.is_owner() then raise exception 'Adminni faqat sayt egasi bloklay oladi'; end if;

  update public.profiles set is_banned = true, is_admin = false, ban_reason = nullif(trim(p_reason), ''), banned_at = now()
  where id = p.id;
  update auth.users set banned_until = 'infinity' where id = p.id;   -- qayta kira olmaydi
  delete from auth.sessions where user_id = p.id;                     -- hozirgi seanslar o'chadi

  v_ip := public._user_ip(p.id);
  if p_ban_ip and v_ip is not null then
    insert into public.banned_ips(ip, reason, created_by)
    values (v_ip, coalesce(nullif(trim(p_reason), ''), 'ID ' || p_public_id), auth.uid())
    on conflict (ip) do nothing;
  end if;
  return jsonb_build_object('public_id', p_public_id, 'ip', v_ip, 'ip_banned', p_ban_ip and v_ip is not null);
end $$;

create or replace function public.admin_unban_user(p_public_id bigint, p_unban_ip boolean)
returns void language plpgsql security definer set search_path = public, auth as $$
declare p public.profiles;
begin
  perform public._require_admin();
  select * into p from public.profiles where public_id = p_public_id;
  if p.id is null then raise exception 'ID % topilmadi', p_public_id; end if;
  update public.profiles set is_banned = false, ban_reason = null, banned_at = null where id = p.id;
  update auth.users set banned_until = null where id = p.id;
  if p_unban_ip then delete from public.banned_ips where ip = public._user_ip(p.id); end if;
end $$;

-- ---------- Admin: IP ni qo'lda bloklash / ochish ----------
create or replace function public.admin_ban_ip(p_ip text, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare v text := trim(coalesce(p_ip, ''));
begin
  perform public._require_admin();
  if v !~ '^[0-9a-fA-F:.]{3,45}$' then raise exception 'IP manzil noto''g''ri'; end if;
  if v = public._client_ip() then raise exception 'O''z IP manzilingizni bloklay olmaysiz'; end if;
  insert into public.banned_ips(ip, reason, created_by) values (v, nullif(trim(p_reason), ''), auth.uid())
  on conflict (ip) do update set reason = excluded.reason;
end $$;

create or replace function public.admin_unban_ip(p_ip text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public._require_admin();
  delete from public.banned_ips where ip = trim(p_ip);
end $$;

-- Admin ro'yxatlari uchun: foydalanuvchilar IP va ban holati bilan
create or replace function public.admin_users_security() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
begin
  perform public._require_admin();
  return coalesce((select jsonb_agg(jsonb_build_object(
      'public_id', p.public_id, 'username', p.username, 'email', p.email, 'telegram', p.telegram,
      'is_banned', p.is_banned, 'ban_reason', p.ban_reason, 'banned_at', p.banned_at,
      'ip', public._user_ip(p.id),
      'ip_banned', public._is_ip_banned(public._user_ip(p.id))) order by p.public_id desc)
    from public.profiles p), '[]'::jsonb);
end $$;

grant execute on function public.admin_ban_user(bigint, text, boolean)   to authenticated;
grant execute on function public.admin_unban_user(bigint, boolean)       to authenticated;
grant execute on function public.admin_ban_ip(text, text)                to authenticated;
grant execute on function public.admin_unban_ip(text)                    to authenticated;
grant execute on function public.admin_users_security()                  to authenticated;
revoke execute on function public.admin_ban_user(bigint, text, boolean), public.admin_unban_user(bigint, boolean),
  public.admin_ban_ip(text, text), public.admin_unban_ip(text), public.admin_users_security() from anon;
