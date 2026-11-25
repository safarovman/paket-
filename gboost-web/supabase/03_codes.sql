-- ============================================================
--  UzDrop v3 — KOD ORQALI TOPSHIRISH (02_uzdrop.sql dan keyin ishga tushiring)
--
--  Sayt login/parolni HECH QACHON foydalanuvchiga ko'rsatmaydi.
--  Xarid / spin yutug'i / balans to'ldirish → foydalanuvchiga KOD beriladi (UZ-XXXX-XXXX).
--  Foydalanuvchi kod + o'z ID raqamini Telegramda adminga yozadi →
--  admin kodni admin panelga kiritadi → ID va Telegram mosligini tekshiradi →
--  login/parolni Telegramda beradi va "Topshirildi" bosadi.
--  Sotuvchiga pul faqat topshirilgandan keyin tushadi (escrow).
-- ============================================================

-- ---------- Foydalanuvchi ID raqami va Telegram ----------
create sequence if not exists public.profiles_public_id_seq start 100001;
alter table public.profiles add column if not exists public_id bigint unique default nextval('public.profiles_public_id_seq');
alter table public.profiles add column if not exists telegram text;

create or replace function public.set_telegram(p_username text) returns void
language plpgsql security definer set search_path = public as $$
declare v text := lower(regexp_replace(coalesce(p_username,''), '^@', ''));
begin
  if auth.uid() is null then raise exception 'Avval tizimga kiring'; end if;
  if v !~ '^[a-z0-9_]{5,32}$' then raise exception 'Telegram username noto''g''ri (masalan: @uzdrop_user)'; end if;
  update public.profiles set telegram = v where id = auth.uid();
end $$;
grant execute on function public.set_telegram(text) to authenticated;

-- ---------- Tasodifiy kod (kriptografik: gen_random_uuid) ----------
create or replace function public._gen_code(p_prefix text) returns text
language plpgsql volatile set search_path = public as $$
declare a text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; b bytea := uuid_send(gen_random_uuid()); s text := ''; i int;
begin
  for i in 0..7 loop
    s := s || substr(a, 1 + get_byte(b, i) % length(a), 1);
    if i = 3 then s := s || '-'; end if;
  end loop;
  return p_prefix || '-' || s;
end $$;

-- ---------- Topshirishlar ----------
create table if not exists public.deliveries (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  account_id  uuid not null references public.accounts(id) on delete cascade,
  source      text not null check (source in ('buy','spin')),
  price       bigint not null,
  status      text not null default 'waiting' check (status in ('waiting','delivered','cancelled')),
  admin_note  text,
  created_at  timestamptz not null default now(),
  done_at     timestamptz
);
create index if not exists deliveries_user_idx on public.deliveries(user_id, created_at desc);
alter table public.deliveries enable row level security;
drop policy if exists "own deliveries" on public.deliveries;
create policy "own deliveries" on public.deliveries for select using (user_id = auth.uid() or public.is_admin());

alter table public.deposits add column if not exists code text unique;

-- ---------- Login/parol: FAQAT admin ko'radi ----------
drop policy if exists "secrets owner" on public.account_secrets;
drop policy if exists "secrets admin" on public.account_secrets;
create policy "secrets admin" on public.account_secrets for select using (public.is_admin());

-- Foydalanuvchi o'zi akkaunt qo'sha olmaydi — faqat admin orqali
revoke execute on function public.submit_account(text,text,text,text,text,int,text,bigint,text,text,text) from authenticated, anon, public;

create or replace function public._new_delivery(p_user uuid, p_account uuid, p_source text, p_price bigint) returns text
language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  loop
    v_code := public._gen_code('UZ');
    begin
      insert into public.deliveries(code,user_id,account_id,source,price) values (v_code,p_user,p_account,p_source,p_price);
      return v_code;
    exception when unique_violation then null;  -- juda kam ehtimol, qayta urinamiz
    end;
  end loop;
end $$;
revoke all on function public._new_delivery(uuid,uuid,text,bigint) from public, anon, authenticated;

-- ---------- Sotib olish → kod ----------
drop function if exists public.buy_account(uuid);
create function public.buy_account(p_account uuid) returns text
language plpgsql security definer set search_path = public as $$
declare a public.accounts; v_bal bigint;
begin
  if auth.uid() is null then raise exception 'Avval tizimga kiring'; end if;
  select * into a from public.accounts where id = p_account for update;
  if a.id is null or a.status <> 'active' then raise exception 'Akkaunt sotuvda emas'; end if;
  if a.seller_id = auth.uid() then raise exception 'O''z akkauntingizni sotib ololmaysiz'; end if;
  select balance into v_bal from public.profiles where id = auth.uid() for update;
  if v_bal < a.price then raise exception 'Balans yetarli emas'; end if;
  perform public._add_balance(auth.uid(), -a.price, 'buy', a.title);
  update public.accounts set status = 'sold', owner_id = auth.uid(), updated_at = now() where id = a.id;
  return public._new_delivery(auth.uid(), a.id, 'buy', a.price);
end $$;
grant execute on function public.buy_account(uuid) to authenticated;

-- ---------- Spin yutug'ini olish → kod ----------
drop function if exists public.claim_won(uuid);
create function public.claim_won(p_account uuid) returns text
language plpgsql security definer set search_path = public as $$
declare a public.accounts;
begin
  select * into a from public.accounts where id = p_account for update;
  if a.id is null or a.owner_id is distinct from auth.uid() or a.status <> 'won' then raise exception 'Akkaunt topilmadi'; end if;
  update public.accounts set status = 'claimed', updated_at = now() where id = a.id;
  return public._new_delivery(auth.uid(), a.id, 'spin', a.price);
end $$;
grant execute on function public.claim_won(uuid) to authenticated;

-- ---------- Balans to'ldirish → kod ----------
drop function if exists public.request_deposit(bigint,text,text);
create function public.request_deposit(p_amount bigint, p_method text, p_note text) returns text
language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if auth.uid() is null then raise exception 'Avval tizimga kiring'; end if;
  if p_amount < 1000 then raise exception 'Minimal summa 1 000 so''m'; end if;
  loop
    v_code := public._gen_code('PAY');
    begin
      insert into public.deposits(user_id, amount, method, note, code) values (auth.uid(), p_amount, p_method, p_note, v_code);
      return v_code;
    exception when unique_violation then null;
    end;
  end loop;
end $$;
grant execute on function public.request_deposit(bigint,text,text) to authenticated;

-- ============================================================
--  ADMIN: kod bo'yicha qidirish, topshirish, bekor qilish
-- ============================================================
create or replace function public.admin_find_code(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v text := upper(trim(p_code)); d public.deliveries; dp public.deposits; r jsonb;
begin
  perform public._require_admin();
  select * into d from public.deliveries where code = v;
  if d.id is not null then
    select jsonb_build_object(
      'type','delivery','code',d.code,'status',d.status,'source',d.source,'price',d.price,
      'created_at',d.created_at,'done_at',d.done_at,'admin_note',d.admin_note,
      'user', jsonb_build_object('public_id',p.public_id,'username',p.username,'email',p.email,'telegram',p.telegram),
      'account', jsonb_build_object('id',a.id,'title',a.title,'game',a.game,'rank',a.rank,'kind',a.kind,'image_url',a.image_url),
      'seller', (select jsonb_build_object('public_id',sp.public_id,'username',sp.username,'telegram',sp.telegram)
                 from public.profiles sp where sp.id = a.seller_id),
      'secret', jsonb_build_object('login',s.login,'password',s.password,'extra',s.extra))
    into r
    from public.profiles p, public.accounts a left join public.account_secrets s on s.account_id = a.id
    where p.id = d.user_id and a.id = d.account_id;
    return r;
  end if;
  select * into dp from public.deposits where code = v;
  if dp.id is not null then
    select jsonb_build_object('type','deposit','id',dp.id,'code',dp.code,'status',dp.status,'amount',dp.amount,
      'method',dp.method,'note',dp.note,'created_at',dp.created_at,
      'user', jsonb_build_object('public_id',p.public_id,'username',p.username,'email',p.email,'telegram',p.telegram))
    into r from public.profiles p where p.id = dp.user_id;
    return r;
  end if;
  raise exception 'Kod topilmadi';
end $$;

create or replace function public.admin_deliver(p_code text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare d public.deliveries; a public.accounts;
begin
  perform public._require_admin();
  select * into d from public.deliveries where code = upper(trim(p_code)) for update;
  if d.id is null or d.status <> 'waiting' then raise exception 'Kod topilmadi yoki allaqachon yopilgan'; end if;
  select * into a from public.accounts where id = d.account_id for update;
  update public.deliveries set status = 'delivered', done_at = now(), admin_note = p_note where id = d.id;
  -- sotuvchiga pul faqat topshirilgandan keyin
  if d.source = 'buy' and a.kind = 'market' and a.seller_id is not null then
    perform public._add_balance(a.seller_id, public.seller_share(d.price), 'sale', a.title);
  end if;
end $$;

-- Bekor qilish (akkaunt ishlamadi va h.k.): xaridorga pul qaytadi, akkaunt sotuvdan olinadi
create or replace function public.admin_cancel_delivery(p_code text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare d public.deliveries;
begin
  perform public._require_admin();
  select * into d from public.deliveries where code = upper(trim(p_code)) for update;
  if d.id is null or d.status <> 'waiting' then raise exception 'Kod topilmadi yoki allaqachon yopilgan'; end if;
  update public.deliveries set status = 'cancelled', done_at = now(), admin_note = p_note where id = d.id;
  perform public._add_balance(d.user_id, d.price, 'refund', 'Bekor qilindi: ' || d.code);
  update public.accounts set status = 'rejected', reject_note = coalesce(p_note,'Topshirish bekor qilindi'), updated_at = now()
  where id = d.account_id;
end $$;

-- Akkaunt joylashda sotuvchini ID raqami bo'yicha topish
create or replace function public.admin_find_user(p_public_id bigint) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.is_admin() then
    (select jsonb_build_object('id',id,'public_id',public_id,'username',username,'email',email,'telegram',telegram,'balance',balance)
     from public.profiles where public_id = p_public_id) end
$$;
