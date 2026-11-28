-- ============================================================
--  UzDrop — BITTA FAYLDA HAMMASI (01…21 birlashtirilgan)
--  Supabase → SQL Editor → hammasini nusxalab qo'ying → Run
--  Qayta ishga tushirish xavfsiz.
-- ============================================================

-- >>>>>>>>>>>>>>>> 01_close_old_gboost.sql <<<<<<<<<<<<<<<<
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


-- >>>>>>>>>>>>>>>> 02_uzdrop.sql <<<<<<<<<<<<<<<<
-- ============================================================
--  UzDrop — Supabase sxemasi (akkaunt bozori + akkaunt spin)
--  Tartib: 01_close_old_gboost.sql → 02_uzdrop.sql → 03_codes.sql
--  Qayta ishga tushirish xavfsiz (idempotent).
-- ============================================================

-- ---------- 1. PROFILLAR (balans shu yerda) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text,
  balance     bigint not null default 0 check (balance >= 0),
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',
                           new.raw_user_meta_data->>'name',
                           split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- mavjud foydalanuvchilar uchun profil
insert into public.profiles (id, username)
select id, coalesce(raw_user_meta_data->>'full_name', split_part(email,'@',1)) from auth.users
on conflict (id) do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- ---------- 2. KEYSLAR (spin) ----------
create table if not exists public.cases (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  game        text not null,
  price       bigint not null check (price > 0),
  image_url   text,
  color       text not null default '#7C5CFF',
  sort        int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- 3. AKKAUNTLAR ----------
-- kind:   market = foydalanuvchi bozorga qo'ygan, quick = tez sotilgan (sayt sotib olgan), site = sayt akkaunti
-- status: pending → active (bozorda) | pool (keys ichida) | rejected
--         active → sold ; pool → won → claimed | pool (qayta sotilsa)
create table if not exists public.accounts (
  id           uuid primary key default gen_random_uuid(),
  game         text not null,
  title        text not null,
  description  text,
  rank         text,
  level        int,
  image_url    text,
  price        bigint not null check (price > 0),
  asked_price  bigint,
  kind         text not null default 'market' check (kind in ('market','quick','site')),
  status       text not null default 'pending'
               check (status in ('pending','active','sold','pool','won','claimed','rejected')),
  seller_id    uuid references public.profiles(id) on delete set null,
  owner_id     uuid references public.profiles(id) on delete set null,
  case_id      uuid references public.cases(id) on delete set null,
  reject_note  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists accounts_status_idx on public.accounts(status);
create index if not exists accounts_case_idx   on public.accounts(case_id) where status = 'pool';
create index if not exists accounts_owner_idx  on public.accounts(owner_id);
create index if not exists accounts_seller_idx on public.accounts(seller_id);

-- login/parol alohida — faqat egasiga ko'rinadi
create table if not exists public.account_secrets (
  account_id  uuid primary key references public.accounts(id) on delete cascade,
  login       text not null,
  password    text not null,
  extra       text
);

-- ---------- 4. SPINLAR (jonli lenta) ----------
create table if not exists public.spins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  username    text,
  case_id     uuid references public.cases(id) on delete set null,
  case_name   text,
  account_id  uuid references public.accounts(id) on delete set null,
  title       text,
  game        text,
  value       bigint not null,
  created_at  timestamptz not null default now()
);
create index if not exists spins_created_idx on public.spins(created_at desc);

-- ---------- 5. TRANZAKSIYALAR, TO'LDIRISH, YECHISH ----------
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,  -- deposit, withdraw, buy, sale, spin, win_sell, quick_sell, refund
  amount      bigint not null,  -- +kirim / -chiqim
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists tx_user_idx on public.transactions(user_id, created_at desc);

create table if not exists public.deposits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      bigint not null check (amount >= 1000),
  method      text not null,
  note        text,
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at  timestamptz not null default now()
);

create table if not exists public.withdrawals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      bigint not null check (amount >= 10000),
  card        text not null,
  status      text not null default 'pending' check (status in ('pending','paid','rejected')),
  created_at  timestamptz not null default now()
);

-- ============================================================
--  RLS — o'qish siyosatlari. Barcha yozish faqat RPC orqali.
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.cases           enable row level security;
alter table public.accounts        enable row level security;
alter table public.account_secrets enable row level security;
alter table public.spins           enable row level security;
alter table public.transactions    enable row level security;
alter table public.deposits        enable row level security;
alter table public.withdrawals     enable row level security;

drop policy if exists "own profile"      on public.profiles;
create policy "own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());

drop policy if exists "cases public"     on public.cases;
create policy "cases public" on public.cases for select using (active or public.is_admin());

drop policy if exists "accounts visible" on public.accounts;
create policy "accounts visible" on public.accounts for select using (
  status in ('active','pool') or seller_id = auth.uid() or owner_id = auth.uid() or public.is_admin()
);

drop policy if exists "secrets owner" on public.account_secrets;
drop policy if exists "secrets admin" on public.account_secrets;
create policy "secrets admin" on public.account_secrets for select using (public.is_admin());

drop policy if exists "spins public"     on public.spins;
create policy "spins public" on public.spins for select using (true);

drop policy if exists "own tx"           on public.transactions;
create policy "own tx" on public.transactions for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "own deposits"     on public.deposits;
create policy "own deposits" on public.deposits for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "own withdrawals"  on public.withdrawals;
create policy "own withdrawals" on public.withdrawals for select using (user_id = auth.uid() or public.is_admin());

-- ============================================================
--  YORDAMCHI
-- ============================================================
create or replace function public._add_balance(p_user uuid, p_amount bigint, p_type text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set balance = balance + p_amount where id = p_user;
  if not found then raise exception 'Profil topilmadi'; end if;
  insert into public.transactions(user_id, type, amount, note) values (p_user, p_type, p_amount, p_note);
end $$;
revoke all on function public._add_balance(uuid,bigint,text,text) from public, anon, authenticated;

create or replace function public._require_admin() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Faqat admin uchun'; end if;
end $$;

-- Sotuvchiga tushadigan ulush (komissiya 10%)
create or replace function public.seller_share(p bigint) returns bigint
language sql immutable as $$ select (p * 90 / 100)::bigint $$;

-- ============================================================
--  FOYDALANUVCHI RPC LARI
-- ============================================================

-- Akkauntni bozorga qo'yish yoki tez sotish
create or replace function public.submit_account(
  p_kind text, p_game text, p_title text, p_description text, p_rank text, p_level int,
  p_image_url text, p_price bigint, p_login text, p_password text, p_extra text
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Avval tizimga kiring'; end if;
  if p_kind not in ('market','quick') then raise exception 'Noto''g''ri tur'; end if;
  if coalesce(p_price,0) < 1000 then raise exception 'Narx kamida 1 000 so''m'; end if;
  if coalesce(trim(p_login),'') = '' or coalesce(trim(p_password),'') = '' then
    raise exception 'Login va parol majburiy';
  end if;
  insert into public.accounts(game,title,description,rank,level,image_url,price,asked_price,kind,status,seller_id)
  values (p_game, p_title, p_description, p_rank, p_level, nullif(p_image_url,''), p_price, p_price, p_kind, 'pending', auth.uid())
  returning id into v_id;
  insert into public.account_secrets(account_id, login, password, extra) values (v_id, p_login, p_password, p_extra);
  return v_id;
end $$;


-- Keys ochish (spin) — tasodif serverda hisoblanadi
create or replace function public.open_case(p_case uuid)
returns table(id uuid, title text, game text, rank text, image_url text, price bigint)
language plpgsql security definer set search_path = public as $$
declare c public.cases; v_bal bigint; v_total float8; v_r float8; v_acc public.accounts; v_name text; rec record;
begin
  if auth.uid() is null then raise exception 'Avval tizimga kiring'; end if;
  select * into c from public.cases where cases.id = p_case and active;
  if c.id is null then raise exception 'Keys topilmadi'; end if;

  select balance, username into v_bal, v_name from public.profiles where profiles.id = auth.uid() for update;
  if v_bal < c.price then raise exception 'Balans yetarli emas'; end if;

  -- og'irlik = 1 / narx  (qimmat akkaunt — kam ehtimol)
  select sum(1.0 / a.price) into v_total from public.accounts a where a.case_id = c.id and a.status = 'pool';
  if v_total is null then raise exception 'Keys hozircha bo''sh'; end if;

  v_r := random() * v_total;
  for rec in
    select a.* from public.accounts a where a.case_id = c.id and a.status = 'pool'
    order by a.price desc, a.id for update skip locked
  loop
    v_r := v_r - 1.0 / rec.price;
    v_acc := rec;
    exit when v_r <= 0;
  end loop;
  if v_acc.id is null then raise exception 'Qayta urinib ko''ring'; end if;

  perform public._add_balance(auth.uid(), -c.price, 'spin', c.name);
  update public.accounts set status = 'won', owner_id = auth.uid(), updated_at = now() where accounts.id = v_acc.id;
  insert into public.spins(user_id, username, case_id, case_name, account_id, title, game, value)
  values (auth.uid(), v_name, c.id, c.name, v_acc.id, v_acc.title, v_acc.game, v_acc.price);

  return query select v_acc.id, v_acc.title, v_acc.game, v_acc.rank, v_acc.image_url, v_acc.price;
end $$;

-- Yutilgan akkauntni darhol sotish (tez sotish) — narxi balansga qaytadi
create or replace function public.sell_won(p_account uuid) returns bigint
language plpgsql security definer set search_path = public as $$
declare a public.accounts;
begin
  select * into a from public.accounts where id = p_account for update;
  if a.id is null or a.owner_id is distinct from auth.uid() or a.status <> 'won' then
    raise exception 'Bu akkauntni sotib bo''lmaydi';
  end if;
  perform public._add_balance(auth.uid(), a.price, 'win_sell', a.title);
  update public.accounts set status = 'pool', owner_id = null, updated_at = now() where id = a.id;
  return a.price;
end $$;



-- Pul yechish so'rovi (summa darhol bloklanadi)
create or replace function public.request_withdraw(p_amount bigint, p_card text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_bal bigint;
begin
  if auth.uid() is null then raise exception 'Avval tizimga kiring'; end if;
  if p_amount < 10000 then raise exception 'Minimal yechish 10 000 so''m'; end if;
  select balance into v_bal from public.profiles where id = auth.uid() for update;
  if v_bal < p_amount then raise exception 'Balans yetarli emas'; end if;
  perform public._add_balance(auth.uid(), -p_amount, 'withdraw', p_card);
  insert into public.withdrawals(user_id, amount, card) values (auth.uid(), p_amount, p_card) returning id into v_id;
  return v_id;
end $$;

-- ============================================================
--  ADMIN RPC LARI
-- ============================================================
create or replace function public.admin_deposit(p_id uuid, p_approve boolean) returns void
language plpgsql security definer set search_path = public as $$
declare d public.deposits;
begin
  perform public._require_admin();
  select * into d from public.deposits where id = p_id for update;
  if d.id is null or d.status <> 'pending' then raise exception 'So''rov topilmadi'; end if;
  update public.deposits set status = case when p_approve then 'approved' else 'rejected' end where id = p_id;
  if p_approve then perform public._add_balance(d.user_id, d.amount, 'deposit', d.method); end if;
end $$;

create or replace function public.admin_withdraw(p_id uuid, p_paid boolean) returns void
language plpgsql security definer set search_path = public as $$
declare w public.withdrawals;
begin
  perform public._require_admin();
  select * into w from public.withdrawals where id = p_id for update;
  if w.id is null or w.status <> 'pending' then raise exception 'So''rov topilmadi'; end if;
  update public.withdrawals set status = case when p_paid then 'paid' else 'rejected' end where id = p_id;
  if not p_paid then perform public._add_balance(w.user_id, w.amount, 'refund', 'Yechish rad etildi'); end if;
end $$;

-- Akkauntni ko'rib chiqish:
--   p_action = 'market'  → bozorga chiqarish (p_price = sotuv narxi)
--   p_action = 'pool'    → keys ichiga qo'yish (p_price = qiymati, p_case majburiy)
--   p_action = 'reject'  → rad etish
--   p_payout             → tez sotishda sotuvchiga to'lanadigan summa
create or replace function public.admin_review_account(
  p_id uuid, p_action text, p_price bigint, p_case uuid, p_payout bigint, p_note text
) returns void language plpgsql security definer set search_path = public as $$
declare a public.accounts;
begin
  perform public._require_admin();
  select * into a from public.accounts where id = p_id for update;
  if a.id is null then raise exception 'Akkaunt topilmadi'; end if;

  if p_action = 'reject' then
    update public.accounts set status = 'rejected', reject_note = p_note, updated_at = now() where id = p_id;
    return;
  end if;

  if a.status = 'pending' and a.kind = 'quick' then
    if coalesce(p_payout,0) <= 0 then raise exception 'To''lov summasini kiriting'; end if;
    perform public._add_balance(a.seller_id, p_payout, 'quick_sell', a.title);
  end if;

  if p_action = 'market' then
    update public.accounts set status = 'active', price = coalesce(p_price, price), case_id = null,
      kind = case when a.kind = 'market' then 'market' else 'site' end, updated_at = now()
    where id = p_id;
  elsif p_action = 'pool' then
    if p_case is null then raise exception 'Keysni tanlang'; end if;
    update public.accounts set status = 'pool', price = coalesce(p_price, price), case_id = p_case,
      kind = case when a.kind = 'market' then 'site' else a.kind end, owner_id = null, updated_at = now()
    where id = p_id;
  else
    raise exception 'Noto''g''ri amal';
  end if;
end $$;

-- Admin o'zi akkaunt qo'shishi (bozor yoki keys uchun)
create or replace function public.admin_add_account(
  p_game text, p_title text, p_description text, p_rank text, p_image_url text, p_price bigint,
  p_case uuid, p_login text, p_password text, p_extra text
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  perform public._require_admin();
  insert into public.accounts(game,title,description,rank,image_url,price,kind,status,case_id)
  values (p_game,p_title,p_description,p_rank,nullif(p_image_url,''),p_price,'site',
          case when p_case is null then 'active' else 'pool' end, p_case)
  returning id into v_id;
  insert into public.account_secrets(account_id,login,password,extra) values (v_id,p_login,p_password,p_extra);
  return v_id;
end $$;

create or replace function public.admin_save_case(
  p_id uuid, p_name text, p_game text, p_price bigint, p_image_url text, p_color text, p_sort int, p_active boolean
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  perform public._require_admin();
  if p_id is null then
    insert into public.cases(name,game,price,image_url,color,sort,active)
    values (p_name,p_game,p_price,nullif(p_image_url,''),coalesce(p_color,'#7C5CFF'),coalesce(p_sort,0),coalesce(p_active,true))
    returning id into v_id;
  else
    update public.cases set name=p_name, game=p_game, price=p_price, image_url=nullif(p_image_url,''),
      color=coalesce(p_color,color), sort=coalesce(p_sort,sort), active=coalesce(p_active,active)
    where id = p_id returning id into v_id;
  end if;
  return v_id;
end $$;

create or replace function public.admin_set_balance(p_user uuid, p_delta bigint, p_note text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public._require_admin();
  perform public._add_balance(p_user, p_delta, 'admin', p_note);
end $$;

-- ---------- Ruxsatlar ----------
grant execute on function public.open_case(uuid)                to authenticated;
grant execute on function public.sell_won(uuid)                 to authenticated;
grant execute on function public.request_withdraw(bigint,text)  to authenticated;

-- ---------- Realtime (jonli spin lentasi) ----------
do $$ begin
  alter publication supabase_realtime add table public.spins;
exception when others then null; end $$;

-- ============================================================
--  BIRINCHI ADMINNI BELGILASH (emailni o'zingiznikiga almashtiring):
--  update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'SIZNING@EMAIL.uz');
-- ============================================================

-- ============================================================
--  v2: TELEGRAM ORQALI SOTISH + ADMIN RASM YUKLAYDI
--  Sotuvchi Telegramda adminga yozadi → admin akkauntni tekshiradi →
--  admin paneldan rasmlari bilan saytga joylaydi → xaridor sotib oladi.
-- ============================================================
alter table public.profiles add column if not exists email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',
                           new.raw_user_meta_data->>'name',
                           split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  return new;
end $$;

alter table public.accounts add column if not exists images text[] not null default '{}';

-- ---------- Rasmlar uchun Storage bucket (ochiq o'qish, faqat admin yuklaydi) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('account-images', 'account-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true;

drop policy if exists "uzdrop images read"   on storage.objects;
create policy "uzdrop images read" on storage.objects for select using (bucket_id = 'account-images');
drop policy if exists "uzdrop images admin"  on storage.objects;
create policy "uzdrop images admin" on storage.objects for all
  using (bucket_id = 'account-images' and public.is_admin())
  with check (bucket_id = 'account-images' and public.is_admin());

-- ---------- Admin akkauntni saytga joylaydi ----------
--  p_mode = 'market' → sotuvchi nomidan sotuvga; sotilganda sotuvchiga 90%
--  p_mode = 'quick'  → tez sotish: sotuvchiga p_payout hozir to'lanadi, akkaunt saytniki
--  p_mode = 'site'   → saytning o'z akkaunti
--  p_case berilsa akkaunt keysga (spin) tushadi, aks holda bozorga.
create or replace function public.admin_create_account(
  p_mode text, p_seller uuid, p_payout bigint,
  p_game text, p_title text, p_description text, p_rank text, p_level int, p_images text[],
  p_price bigint, p_case uuid, p_login text, p_password text, p_extra text
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_kind text;
begin
  perform public._require_admin();
  if p_mode not in ('market','quick','site') then raise exception 'Noto''g''ri tur'; end if;
  if coalesce(p_price,0) < 1000 then raise exception 'Narx kamida 1 000 so''m'; end if;
  if coalesce(trim(p_title),'') = '' then raise exception 'Sarlavha majburiy'; end if;
  if coalesce(trim(p_login),'') = '' or coalesce(trim(p_password),'') = '' then raise exception 'Login va parol majburiy'; end if;
  if p_mode in ('market','quick') and p_seller is null then raise exception 'Sotuvchini tanlang'; end if;
  if p_mode = 'market' and p_case is not null then raise exception 'Sotuvchi akkaunti keysga qo''yilmaydi — tez sotishni tanlang'; end if;
  if p_mode = 'quick' and coalesce(p_payout,0) <= 0 then raise exception 'Sotuvchiga to''lov summasini kiriting'; end if;

  v_kind := p_mode;
  insert into public.accounts(game,title,description,rank,level,images,image_url,price,asked_price,kind,status,seller_id,case_id)
  values (p_game, trim(p_title), nullif(trim(p_description),''), nullif(trim(p_rank),''), p_level,
          coalesce(p_images,'{}'), (coalesce(p_images,'{}'))[1], p_price, p_payout, v_kind,
          case when p_case is null then 'active' else 'pool' end,
          case when p_mode = 'site' then null else p_seller end, p_case)
  returning id into v_id;
  insert into public.account_secrets(account_id,login,password,extra) values (v_id, trim(p_login), p_password, nullif(trim(p_extra),''));

  if p_mode = 'quick' then
    perform public._add_balance(p_seller, p_payout, 'quick_sell', trim(p_title));
  end if;
  return v_id;
end $$;

-- Sotuvdagi akkauntni tahrirlash
create or replace function public.admin_update_account(
  p_id uuid, p_title text, p_description text, p_rank text, p_level int, p_price bigint, p_images text[]
) returns void language plpgsql security definer set search_path = public as $$
begin
  perform public._require_admin();
  update public.accounts set title = coalesce(nullif(trim(p_title),''), title), description = nullif(trim(p_description),''),
    rank = nullif(trim(p_rank),''), level = p_level, price = coalesce(p_price, price),
    images = coalesce(p_images, images), image_url = (coalesce(p_images, images))[1], updated_at = now()
  where id = p_id and status in ('pending','active','pool');
  if not found then raise exception 'Akkaunt topilmadi yoki allaqachon sotilgan'; end if;
end $$;

-- Sotuvdan olib tashlash
create or replace function public.admin_remove_account(p_id uuid, p_note text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public._require_admin();
  update public.accounts set status = 'rejected', reject_note = p_note, updated_at = now()
  where id = p_id and status in ('pending','active','pool');
  if not found then raise exception 'Akkaunt topilmadi yoki allaqachon sotilgan'; end if;
end $$;


-- >>>>>>>>>>>>>>>> 03_codes.sql <<<<<<<<<<<<<<<<
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


-- >>>>>>>>>>>>>>>> 04_account_admins.sql <<<<<<<<<<<<<<<<
-- ============================================================
--  UzDrop v4 — AKKAUNT ID + MAS'UL ADMIN (03_codes.sql dan keyin)
--  Har bir akkauntga raqam (#1001, #1002…) va mas'ul admin bog'lanadi.
--  Xaridor sotib olgach: akkaunt ID + maxfiy kod + mas'ul adminning @telegram'i beriladi.
--  Bir nechta admin bo'lishi mumkin; adminlarni faqat EGA (is_owner) tayinlaydi.
-- ============================================================

create sequence if not exists public.accounts_public_no_seq start 1001;
alter table public.accounts add column if not exists public_no bigint unique default nextval('public.accounts_public_no_seq');
alter table public.accounts add column if not exists admin_id uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists is_owner boolean not null default false;

-- Akkauntni yaratgan admin avtomatik mas'ul bo'ladi
create or replace function public._set_account_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.admin_id is null and public.is_admin() then new.admin_id := auth.uid(); end if;
  return new;
end $$;
drop trigger if exists accounts_set_admin on public.accounts;
create trigger accounts_set_admin before insert on public.accounts
  for each row execute function public._set_account_admin();

-- Ega bo'lsa
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_owner from public.profiles where id = auth.uid()), false)
$$;

-- ---------- Xaridor uchun: akkaunt raqami va mas'ul admin @telegram ----------
-- Admin username'lari ochiq aloqa ma'lumoti; boshqa hech narsa qaytarilmaydi.
create or replace function public.account_contact(p_account uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('public_no', a.public_no, 'admin_telegram', p.telegram, 'admin_name', p.username)
  from public.accounts a left join public.profiles p on p.id = a.admin_id and p.is_admin
  where a.id = p_account
$$;
grant execute on function public.account_contact(uuid) to anon, authenticated;

-- Adminlar ro'yxati (faqat @telegram va ism) — "Bizning adminlar" va tanlash uchun
create or replace function public.admin_contacts() returns table(id uuid, username text, telegram text)
language sql stable security definer set search_path = public as $$
  select id, username, telegram from public.profiles where is_admin and telegram is not null order by created_at
$$;
grant execute on function public.admin_contacts() to anon, authenticated;

-- ---------- Ega: admin tayinlash / olib tashlash ----------
create or replace function public.owner_set_admin(p_user uuid, p_admin boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'Faqat sayt egasi uchun'; end if;
  if p_user = auth.uid() and not p_admin then raise exception 'O''zingizni olib tashlay olmaysiz'; end if;
  update public.profiles set is_admin = p_admin where id = p_user;
end $$;

-- Akkauntni boshqa adminga o'tkazish (ega yoki hozirgi mas'ul admin)
create or replace function public.admin_assign_account(p_account uuid, p_admin uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a public.accounts;
begin
  perform public._require_admin();
  select * into a from public.accounts where id = p_account for update;
  if a.id is null then raise exception 'Akkaunt topilmadi'; end if;
  if not public.is_owner() and a.admin_id is not null and a.admin_id <> auth.uid() then
    raise exception 'Bu akkaunt boshqa adminga tegishli';
  end if;
  if not exists (select 1 from public.profiles where id = p_admin and is_admin) then raise exception 'Bu foydalanuvchi admin emas'; end if;
  update public.accounts set admin_id = p_admin, updated_at = now() where id = p_account;
end $$;

-- ---------- Kod YOKI akkaunt ID (#1024) bo'yicha qidirish ----------
create or replace function public.admin_find_code(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v text := upper(trim(p_code)); d public.deliveries; dp public.deposits; r jsonb; v_no bigint;
begin
  perform public._require_admin();

  -- "#1024" yoki "1024" → shu akkauntning oxirgi topshirishi
  if v ~ '^#?[0-9]{1,12}$' then
    v_no := replace(v, '#', '')::bigint;
    select dl.* into d from public.deliveries dl join public.accounts a on a.id = dl.account_id
    where a.public_no = v_no order by (dl.status = 'waiting') desc, dl.created_at desc limit 1;
    if d.id is null then raise exception 'Bu akkaunt (#%) hali sotilmagan', v_no; end if;
  else
    select * into d from public.deliveries where code = v;
  end if;

  if d.id is not null then
    select jsonb_build_object(
      'type','delivery','code',d.code,'status',d.status,'source',d.source,'price',d.price,
      'created_at',d.created_at,'done_at',d.done_at,'admin_note',d.admin_note,
      'searched_by_no', v ~ '^#?[0-9]{1,12}$',
      'user', jsonb_build_object('public_id',p.public_id,'username',p.username,'email',p.email,'telegram',p.telegram),
      'account', jsonb_build_object('id',a.id,'public_no',a.public_no,'title',a.title,'game',a.game,'rank',a.rank,'kind',a.kind,'image_url',a.image_url),
      'admin', (select jsonb_build_object('id',ap.id,'username',ap.username,'telegram',ap.telegram)
                from public.profiles ap where ap.id = a.admin_id),
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

-- ============================================================
--  SAYT EGASINI BELGILASH (bir marta, o'z emailingiz bilan):
--  update public.profiles set is_owner = true, is_admin = true
--   where id = (select id from auth.users where email = 'SIZNING@EMAIL');
-- ============================================================


-- >>>>>>>>>>>>>>>> 05_settings.sql <<<<<<<<<<<<<<<<
-- ============================================================
--  UzDrop v5 — TO'LOV KARTASI SOZLAMASI (04 dan keyin)
--  Karta raqamini admin paneldan bir daqiqada almashtirish va to'ldirishni
--  vaqtincha to'xtatish (masalan karta bloklansa). Saytni qayta yig'ish shart emas.
--  XAVFSIZLIK: kartani faqat sayt EGASI o'zgartira oladi — boshqa admin pulni
--  o'z kartasiga yo'naltira olmasligi uchun.
-- ============================================================
create table if not exists public.site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles(id) on delete set null
);
alter table public.site_settings enable row level security;
drop policy if exists "settings public read" on public.site_settings;
create policy "settings public read" on public.site_settings for select using (key in ('deposit'));

insert into public.site_settings(key, value)
values ('deposit', jsonb_build_object('enabled', true, 'card', '', 'owner', '', 'message', ''))
on conflict (key) do nothing;

-- qaysi kartaga to'langanini eslab qolish (karta almashsa ham admin biladi)
alter table public.deposits add column if not exists card_last4 text;

create or replace function public.owner_set_deposit(p_enabled boolean, p_card text, p_owner text, p_message text) returns void
language plpgsql security definer set search_path = public as $$
declare v_card text := regexp_replace(coalesce(p_card,''), '\D', '', 'g');
begin
  if not public.is_owner() then raise exception 'Faqat sayt egasi uchun'; end if;
  if v_card <> '' and length(v_card) <> 16 then raise exception 'Karta raqami 16 ta raqam bo''lishi kerak'; end if;
  if p_enabled and v_card = '' then raise exception 'To''ldirishni yoqish uchun karta raqamini kiriting'; end if;
  insert into public.site_settings(key, value, updated_at, updated_by)
  values ('deposit', jsonb_build_object('enabled', p_enabled,
            'card', regexp_replace(v_card, '(\d{4})(?=\d)', '\1 ', 'g'),
            'owner', upper(trim(coalesce(p_owner,''))), 'message', trim(coalesce(p_message,''))), now(), auth.uid())
  on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = auth.uid();
end $$;

-- To'ldirish so'rovi: to'xtatilgan bo'lsa rad etiladi, karta oxirgi 4 raqami saqlanadi
create or replace function public.request_deposit(p_amount bigint, p_method text, p_note text) returns text
language plpgsql security definer set search_path = public as $$
declare v_code text; s jsonb;
begin
  if auth.uid() is null then raise exception 'Avval tizimga kiring'; end if;
  select value into s from public.site_settings where key = 'deposit';
  if s is not null and not coalesce((s->>'enabled')::boolean, true) then
    raise exception 'Balans to''ldirish vaqtincha to''xtatilgan. %', coalesce(nullif(s->>'message',''), 'Keyinroq urinib ko''ring.');
  end if;
  if p_amount < 1000 then raise exception 'Minimal summa 1 000 so''m'; end if;
  loop
    v_code := public._gen_code('PAY');
    begin
      insert into public.deposits(user_id, amount, method, note, code, card_last4)
      values (auth.uid(), p_amount, p_method, p_note, v_code, right(regexp_replace(coalesce(s->>'card',''), '\D', '', 'g'), 4));
      return v_code;
    exception when unique_violation then null;
    end;
  end loop;
end $$;
grant execute on function public.request_deposit(bigint,text,text) to authenticated;


-- >>>>>>>>>>>>>>>> 06_admin_stats.sql <<<<<<<<<<<<<<<<
-- ============================================================
--  UzDrop v6 — ADMIN STATISTIKA + TELEGRAM ORQALI TO'LDIRISH (05 dan keyin)
--  Qayta ishga tushirish xavfsiz.
-- ============================================================

-- Foydalanuvchi Telegramda chek yuboradi → admin ID raqami va summani kiritadi.
-- Tasdiqlangan deposit yozuvi yaratiladi (statistikada hisoblanadi) va balans to'ldiriladi.
create or replace function public.admin_manual_deposit(p_public_id bigint, p_amount bigint, p_note text) returns text
language plpgsql security definer set search_path = public as $$
declare v_user uuid; v_code text;
begin
  perform public._require_admin();
  if coalesce(p_amount, 0) < 1000 then raise exception 'Minimal summa 1 000 so''m'; end if;
  select id into v_user from public.profiles where public_id = p_public_id;
  if v_user is null then raise exception 'ID % li foydalanuvchi topilmadi', p_public_id; end if;
  loop
    v_code := public._gen_code('PAY');
    begin
      insert into public.deposits(user_id, amount, method, note, code, status)
      values (v_user, p_amount, 'telegram', nullif(trim(coalesce(p_note,'')), ''), v_code, 'approved');
      exit;
    exception when unique_violation then null;
    end;
  end loop;
  perform public._add_balance(v_user, p_amount, 'deposit', 'Telegram orqali: ' || coalesce(nullif(trim(p_note),''), v_code));
  return v_code;
end $$;

-- Admin uchun umumiy statistika
create or replace function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  perform public._require_admin();
  select jsonb_build_object(
    'totals', jsonb_build_object(
      'users',           (select count(*) from public.profiles),
      'new_today',       (select count(*) from public.profiles where created_at >= date_trunc('day', now())),
      'new_7d',          (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
      'deposits_sum',    (select coalesce(sum(amount), 0) from public.deposits where status = 'approved'),
      'sales_count',     (select count(*) from public.deliveries where status = 'delivered'),
      'active_listings', (select count(*) from public.accounts where status = 'active')
    ),
    'top_depositors', coalesce((
      select jsonb_agg(t order by t.total desc) from (
        select p.public_id, p.username, p.email, p.telegram,
               sum(d.amount) as total, count(*) as count, max(d.created_at) as last_at
        from public.deposits d join public.profiles p on p.id = d.user_id
        where d.status = 'approved'
        group by p.id
        order by total desc
        limit 20
      ) t), '[]'::jsonb),
    'new_users', coalesce((
      select jsonb_agg(t order by t.created_at desc) from (
        select public_id, username, email, telegram, created_at, balance
        from public.profiles order by created_at desc limit 30
      ) t), '[]'::jsonb),
    'big_wins', coalesce((
      select jsonb_agg(t order by t.value desc) from (
        select s.username, p.public_id, s.title, s.game, s.value, s.created_at
        from public.spins s left join public.profiles p on p.id = s.user_id
        order by s.value desc limit 20
      ) t), '[]'::jsonb)
  ) into r;
  return r;
end $$;


-- >>>>>>>>>>>>>>>> 07_activity.sql <<<<<<<<<<<<<<<<
-- ============================================================
--  UzDrop v7 — FAOLLIK: adminga jonli lenta va foydalanuvchi tarixi (06 dan keyin)
--  Har bir pul harakati (xarid, to'ldirish, yechish, sotuv, qaytarish) transactions
--  jadvaliga yoziladi → admin panelda darhol ko'rinadi (realtime) va
--  Telegram botga xabar boradi (notify-admin funksiyasi, DEPLOY.md).
-- ============================================================

-- Realtime: admin panel yangi amallarni darhol oladi (RLS: faqat admin ko'radi)
do $$ begin alter publication supabase_realtime add table public.transactions; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.deliveries;   exception when others then null; end $$;

-- So'nggi amallar lentasi
create or replace function public.admin_activity_feed(p_limit int default 100) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform public._require_admin();
  return coalesce((
    select jsonb_agg(x order by x->>'created_at' desc) from (
      select jsonb_build_object('id', t.id, 'type', t.type, 'amount', t.amount, 'note', t.note, 'created_at', t.created_at,
        'user', jsonb_build_object('id', p.id, 'public_id', p.public_id, 'username', p.username, 'telegram', p.telegram, 'balance', p.balance)) x
      from public.transactions t join public.profiles p on p.id = t.user_id
      order by t.created_at desc limit least(greatest(coalesce(p_limit,100),1),500)
    ) s), '[]'::jsonb);
end $$;

-- Bitta foydalanuvchining to'liq tarixi (ID raqami bo'yicha)
create or replace function public.admin_user_activity(p_public_id bigint) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p public.profiles;
begin
  perform public._require_admin();
  select * into p from public.profiles where public_id = p_public_id;
  if p.id is null then raise exception 'ID % li foydalanuvchi topilmadi', p_public_id; end if;
  return jsonb_build_object(
    'user', jsonb_build_object('id', p.id, 'public_id', p.public_id, 'username', p.username, 'email', p.email,
      'telegram', p.telegram, 'balance', p.balance, 'is_admin', p.is_admin, 'created_at', p.created_at),
    'summary', jsonb_build_object(
      'deposited', (select coalesce(sum(amount),0) from public.deposits where user_id = p.id and status = 'approved'),
      'spent',     (select coalesce(-sum(amount),0) from public.transactions where user_id = p.id and type in ('buy','spin')),
      'earned',    (select coalesce(sum(amount),0) from public.transactions where user_id = p.id and type in ('sale','quick_sell','win_sell')),
      'withdrawn', (select coalesce(sum(amount),0) from public.withdrawals where user_id = p.id and status <> 'rejected'),
      'purchases', (select count(*) from public.deliveries where user_id = p.id)),
    'transactions', coalesce((select jsonb_agg(jsonb_build_object('type',type,'amount',amount,'note',note,'created_at',created_at) order by created_at desc)
                     from (select * from public.transactions where user_id = p.id order by created_at desc limit 300) t), '[]'),
    'deliveries', coalesce((select jsonb_agg(jsonb_build_object('code',d.code,'status',d.status,'source',d.source,'price',d.price,
                       'created_at',d.created_at,'done_at',d.done_at,'public_no',a.public_no,'title',a.title,'game',a.game) order by d.created_at desc)
                     from public.deliveries d join public.accounts a on a.id = d.account_id where d.user_id = p.id), '[]'),
    'sold_accounts', coalesce((select jsonb_agg(jsonb_build_object('public_no',public_no,'title',title,'status',status,'price',price,'kind',kind,'created_at',created_at) order by created_at desc)
                     from public.accounts where seller_id = p.id), '[]'),
    'deposits', coalesce((select jsonb_agg(jsonb_build_object('code',code,'amount',amount,'method',method,'status',status,'created_at',created_at) order by created_at desc)
                     from public.deposits where user_id = p.id), '[]'),
    'withdrawals', coalesce((select jsonb_agg(jsonb_build_object('amount',amount,'card',card,'status',status,'created_at',created_at) order by created_at desc)
                     from public.withdrawals where user_id = p.id), '[]')
  );
end $$;


-- >>>>>>>>>>>>>>>> 08_ensure_profile.sql <<<<<<<<<<<<<<<<
-- ============================================================
--  UzDrop v8 — PROFIL KAFOLATI (07 dan keyin)
--  Agar biror sabab bilan foydalanuvchining profili (ID raqami, balansi) yaratilmagan
--  bo'lsa, sayt kirganda uni avtomatik yaratadi.
-- ============================================================

-- Yetishmayotgan barcha profillarni hozir yaratish
insert into public.profiles (id, username, email)
select id, coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)), email
from auth.users
on conflict (id) do nothing;

-- Email bo'sh qolgan profillarni to'ldirish
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;

-- Sayt chaqiradigan funksiya: o'z profilingiz yo'q bo'lsa yaratadi
create or replace function public.ensure_profile() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.profiles (id, username, email)
  select id, coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)), email
  from auth.users where id = auth.uid()
  on conflict (id) do nothing;
end $$;
grant execute on function public.ensure_profile() to authenticated;

-- >>>>>>>>>>>>>>>> 09_grants.sql <<<<<<<<<<<<<<<<
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

-- >>>>>>>>>>>>>>>> 10_unique_telegram.sql <<<<<<<<<<<<<<<<
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

-- >>>>>>>>>>>>>>>> 11_disable_withdraw.sql <<<<<<<<<<<<<<<<
-- ============================================================
--  UzDrop v11 — PUL YECHISH O'CHIRILDI (10 dan keyin)
--  Saytda pul yechish yo'q: foydalanuvchilar request_withdraw ni chaqira olmaydi.
--  Qayta yoqish kerak bo'lsa:
--    grant execute on function public.request_withdraw(bigint,text) to authenticated;
-- ============================================================
revoke execute on function public.request_withdraw(bigint, text) from authenticated, anon, public;

-- >>>>>>>>>>>>>>>> 12_notify.sql <<<<<<<<<<<<<<<<
-- ============================================================
--  UzDrop v12 — TELEGRAM XABARNOMA (11 dan keyin)
--  Har bir yangi tranzaksiyada notify-admin funksiyasi chaqiriladi.
--  Funksiyaga faqat tranzaksiya ID si yuboriladi; u bazadan o'zi tekshiradi.
--  Xabar yuborishdagi xato xarid/to'ldirishni HECH QACHON to'xtatmaydi.
-- ============================================================
create extension if not exists pg_net with schema extensions;

alter table public.transactions add column if not exists notified_at timestamptz;

create or replace function public._notify_admin() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  begin
    perform net.http_post(
      url     := 'https://acwlvsazpqjnunqbaxyx.supabase.co/functions/v1/notify-admin',
      body    := jsonb_build_object('id', new.id),
      headers := '{"Content-Type":"application/json"}'::jsonb
    );
  exception when others then
    null; -- xabarnoma ishlamasa ham asosiy amal davom etadi
  end;
  return new;
end $$;
revoke execute on function public._notify_admin() from anon, authenticated, public;

drop trigger if exists transactions_notify on public.transactions;
create trigger transactions_notify after insert on public.transactions
  for each row execute function public._notify_admin();

-- >>>>>>>>>>>>>>>> 13_usage.sql <<<<<<<<<<<<<<<<
-- ============================================================
--  UzDrop v13 — BEPUL TARIF LIMITLARI (12 dan keyin)
--  Admin panel → Statistika: baza hajmi, fayllar, faol foydalanuvchilar.
-- ============================================================
create or replace function public.admin_usage() returns jsonb
language plpgsql stable security definer set search_path = public, storage, auth as $$
begin
  perform public._require_admin();
  return jsonb_build_object(
    'db_bytes',       pg_database_size(current_database()),
    'storage_bytes',  coalesce((select sum((metadata->>'size')::bigint) from storage.objects), 0),
    'storage_files',  (select count(*) from storage.objects),
    'mau',            (select count(*) from auth.users where last_sign_in_at > now() - interval '30 days'),
    'users',          (select count(*) from auth.users),
    'tables', coalesce((
      select jsonb_agg(jsonb_build_object('name', s.relname, 'bytes', pg_total_relation_size(c.oid), 'rows', s.n_live_tup) order by pg_total_relation_size(c.oid) desc)
      from pg_stat_user_tables s join pg_class c on c.oid = s.relid
      where s.schemaname = 'public'), '[]'::jsonb)
  );
end $$;
revoke execute on function public.admin_usage() from anon, public;
grant execute on function public.admin_usage() to authenticated;

-- >>>>>>>>>>>>>>>> 14_bans.sql <<<<<<<<<<<<<<<<
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

-- >>>>>>>>>>>>>>>> 15_rate_limits.sql <<<<<<<<<<<<<<<<
-- ============================================================
--  UzDrop v15 — SO'ROV CHEKLOVLARI (spam / DDoS himoyasi) (14 dan keyin)
--  Bitta foydalanuvchi: bir vaqtda 3 tadan ko'p kutilayotgan to'ldirish so'rovi
--  va soatiga 10 tadan ko'p so'rov yubora olmaydi.
-- ============================================================
create index if not exists deposits_user_created_idx on public.deposits(user_id, created_at desc);

create or replace function public.request_deposit(p_amount bigint, p_method text, p_note text) returns text
language plpgsql security definer set search_path = public as $$
declare v_code text; s jsonb;
begin
  if auth.uid() is null then raise exception 'Avval tizimga kiring'; end if;
  select value into s from public.site_settings where key = 'deposit';
  if s is not null and not coalesce((s->>'enabled')::boolean, true) then
    raise exception 'Balans to''ldirish vaqtincha to''xtatilgan. %', coalesce(nullif(s->>'message',''), 'Keyinroq urinib ko''ring.');
  end if;
  if p_amount < 1000 then raise exception 'Minimal summa 1 000 so''m'; end if;
  if p_amount > 100000000 then raise exception 'Summa juda katta'; end if;
  if (select count(*) from public.deposits where user_id = auth.uid() and status = 'pending') >= 3 then
    raise exception 'Sizda 3 ta tasdiqlanmagan so''rov bor. Admin tasdiqlashini kuting.';
  end if;
  if (select count(*) from public.deposits where user_id = auth.uid() and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Juda ko''p so''rov. 1 soatdan keyin qayta urinib ko''ring.';
  end if;
  loop
    v_code := public._gen_code('PAY');
    begin
      insert into public.deposits(user_id, amount, method, note, code, card_last4)
      values (auth.uid(), p_amount, p_method, left(p_note, 300), v_code, right(regexp_replace(coalesce(s->>'card',''), '\D', '', 'g'), 4));
      return v_code;
    exception when unique_violation then null;
    end;
  end loop;
end $$;
grant execute on function public.request_deposit(bigint,text,text) to authenticated;

-- >>>>>>>>>>>>>>>> 16_service_role.sql <<<<<<<<<<<<<<<<
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

-- >>>>>>>>>>>>>>>> 17_auctions.sql <<<<<<<<<<<<<<<<
-- ============================================================
--  UzDrop v17 — AKKAUNT AUKSIONI (16 dan keyin)
--  Admin sotuvdagi akkauntni auksionga qo'yadi. Foydalanuvchilar balansdan
--  taklif beradi: taklif summasi darhol balansdan yechiladi, oldingi eng
--  yuqori taklif egasiga pul to'liq qaytariladi. Oxirgi 2 daqiqada taklif
--  tushsa auksion 2 daqiqaga uzayadi (anti-sniping). Vaqt tugagach g'olibga
--  oddiy xarid kabi kod beriladi (admin Telegramda topshiradi).
-- ============================================================

-- accounts.status ga 'auction' qo'shish (+ ramka ustuni, 18 bilan bir xil)
alter table public.accounts add column if not exists frame text;
alter table public.accounts drop constraint if exists accounts_status_check;
alter table public.accounts add constraint accounts_status_check
  check (status in ('pending','active','sold','pool','won','claimed','rejected','auction'));

create table if not exists public.auctions (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid not null references public.accounts(id) on delete cascade,
  start_price     bigint not null check (start_price >= 1000),
  min_step        bigint not null check (min_step >= 100),
  current_bid     bigint,
  current_bidder  uuid references public.profiles(id) on delete set null,
  bids_count      int not null default 0,
  ends_at         timestamptz not null,
  status          text not null default 'live' check (status in ('live','ended','cancelled')),
  winner_id       uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  created_by      uuid references public.profiles(id) on delete set null
);
create unique index if not exists auctions_one_live_per_account on public.auctions(account_id) where status = 'live';
create index if not exists auctions_status_ends_idx on public.auctions(status, ends_at);

create table if not exists public.auction_bids (
  id          uuid primary key default gen_random_uuid(),
  auction_id  uuid not null references public.auctions(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      bigint not null,
  created_at  timestamptz not null default now()
);
create index if not exists auction_bids_auction_idx on public.auction_bids(auction_id, created_at desc);

alter table public.auctions     enable row level security;
alter table public.auction_bids enable row level security;

-- auctions: hamma o'qiy oladi, lekin taklifchi uuid lari ochiq ko'rsatilmaydi —
-- sayt ochiq ma'lumotni auction_list() orqali oladi. Jadvalni to'g'ridan-to'g'ri
-- faqat admin o'qiydi (admin panel), oddiy foydalanuvchi faqat o'zi g'olib bo'lganini.
drop policy if exists "auctions read" on public.auctions;
create policy "auctions read" on public.auctions for select
  using (public.is_admin() or winner_id = auth.uid() or current_bidder = auth.uid());
drop policy if exists "bids own" on public.auction_bids;
create policy "bids own" on public.auction_bids for select using (public.is_admin() or user_id = auth.uid());

revoke all on public.auctions, public.auction_bids from anon, authenticated;
grant select on public.auctions, public.auction_bids to authenticated;

-- Realtime (admin va o'z taklifi bor foydalanuvchi uchun RLS bo'yicha)
do $$ begin alter publication supabase_realtime add table public.auctions; exception when others then null; end $$;

-- Ismni yashirish: "Al***"
create or replace function public._mask_name(p text) returns text
language sql immutable as $$
  select case when coalesce(p,'') = '' then '***' else left(p, 2) || '***' end
$$;

-- ---------- Ochiq ro'yxat (hamma uchun, maxfiy ma'lumotlarsiz) ----------
create or replace function public.auction_list(p_status text default 'live', p_limit int default 50)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by (x->>'sort_key')), '[]'::jsonb) from (
    select jsonb_build_object(
      'id', au.id, 'status', au.status, 'start_price', au.start_price, 'min_step', au.min_step,
      'current_bid', au.current_bid, 'bids_count', au.bids_count, 'ends_at', au.ends_at, 'created_at', au.created_at,
      'min_next', coalesce(au.current_bid + au.min_step, au.start_price),
      'leader', case when au.current_bidder is null then null else jsonb_build_object(
          'public_id', lp.public_id, 'name', public._mask_name(lp.username)) end,
      'winner', case when au.winner_id is null then null else jsonb_build_object(
          'public_id', wp.public_id, 'name', public._mask_name(wp.username)) end,
      'is_mine_leading', au.current_bidder = auth.uid(),
      'is_mine_won', au.winner_id = auth.uid(),
      'account', jsonb_build_object('id', a.id, 'public_no', a.public_no, 'title', a.title, 'game', a.game,
          'rank', a.rank, 'level', a.level, 'description', a.description, 'image_url', a.image_url,
          'images', a.images, 'price', a.price, 'frame', a.frame),
      'sort_key', case when p_status = 'live' then to_char(au.ends_at, 'YYYYMMDDHH24MISS')
                       else to_char(9999999999 - extract(epoch from au.ends_at)::bigint, 'FM0000000000') end
    ) x
    from public.auctions au
    join public.accounts a on a.id = au.account_id
    left join public.profiles lp on lp.id = au.current_bidder
    left join public.profiles wp on wp.id = au.winner_id
    where (p_status = 'live' and au.status = 'live')
       or (p_status = 'ended' and au.status = 'ended')
    order by case when p_status = 'live' then au.ends_at end asc,
             case when p_status <> 'live' then au.ends_at end desc
    limit least(greatest(coalesce(p_limit, 50), 1), 100)
  ) s
$$;

-- Takliflar tarixi (yashirilgan ism bilan)
create or replace function public.auction_bids(p_auction uuid)
returns table(amount bigint, created_at timestamptz, bidder_public_id bigint, bidder_name text, is_mine boolean)
language sql stable security definer set search_path = public as $$
  select b.amount, b.created_at, p.public_id, public._mask_name(p.username), b.user_id = auth.uid()
  from public.auction_bids b join public.profiles p on p.id = b.user_id
  where b.auction_id = p_auction
  order by b.created_at desc
  limit 50
$$;

-- ---------- Taklif berish ----------
create or replace function public.place_bid(p_auction uuid, p_amount bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare au public.auctions; a public.accounts; v_bal bigint; v_min bigint; v_prev_bidder uuid; v_prev_amount bigint;
begin
  if auth.uid() is null then raise exception 'Avval tizimga kiring'; end if;
  select * into au from public.auctions where id = p_auction for update;
  if au.id is null or au.status <> 'live' then raise exception 'Auksion faol emas'; end if;
  if au.ends_at <= now() then raise exception 'Auksion vaqti tugagan'; end if;

  v_min := coalesce(au.current_bid + au.min_step, au.start_price);
  if p_amount is null or p_amount < v_min then
    raise exception 'Taklif kamida % so''m bo''lishi kerak', v_min;
  end if;
  if p_amount > 1000000000 then raise exception 'Summa juda katta'; end if;

  select * into a from public.accounts where id = au.account_id;
  if a.seller_id = auth.uid() then raise exception 'O''z akkauntingizga taklif bera olmaysiz'; end if;

  v_prev_bidder := au.current_bidder;
  v_prev_amount := au.current_bid;

  -- O'z taklifini oshirsa — faqat farq yechiladi
  if v_prev_bidder = auth.uid() then
    select balance into v_bal from public.profiles where id = auth.uid() for update;
    if v_bal < p_amount - v_prev_amount then raise exception 'Balans yetarli emas'; end if;
    perform public._add_balance(auth.uid(), -(p_amount - v_prev_amount), 'bid', '#' || a.public_no || ' auksion (taklif oshirildi)');
  else
    select balance into v_bal from public.profiles where id = auth.uid() for update;
    if v_bal < p_amount then raise exception 'Balans yetarli emas'; end if;
    perform public._add_balance(auth.uid(), -p_amount, 'bid', '#' || a.public_no || ' auksion');
    if v_prev_bidder is not null then
      perform public._add_balance(v_prev_bidder, v_prev_amount, 'bid_refund', '#' || a.public_no || ' auksion: taklifingiz oshib ketildi');
    end if;
  end if;

  insert into public.auction_bids(auction_id, user_id, amount) values (au.id, auth.uid(), p_amount);
  update public.auctions set
    current_bid = p_amount,
    current_bidder = auth.uid(),
    bids_count = bids_count + 1,
    ends_at = case when ends_at - now() < interval '2 minutes' then now() + interval '2 minutes' else ends_at end
  where id = au.id
  returning * into au;

  return jsonb_build_object('current_bid', au.current_bid, 'ends_at', au.ends_at, 'bids_count', au.bids_count);
end $$;

-- ---------- Tugagan auksionlarni yakunlash (hamma chaqira oladi, idempotent) ----------
create or replace function public.finalize_auctions() returns int
language plpgsql security definer set search_path = public as $$
declare au public.auctions; n int := 0;
begin
  for au in
    select * from public.auctions where status = 'live' and ends_at <= now()
    order by ends_at for update skip locked
  loop
    begin
      if au.current_bidder is not null then
        update public.accounts set status = 'sold', owner_id = au.current_bidder, updated_at = now() where id = au.account_id;
        perform public._new_delivery(au.current_bidder, au.account_id, 'buy', au.current_bid);
        update public.auctions set status = 'ended', winner_id = au.current_bidder where id = au.id;
      else
        update public.accounts set status = 'active', updated_at = now() where id = au.account_id and status = 'auction';
        update public.auctions set status = 'ended' where id = au.id;
      end if;
      n := n + 1;
    exception when others then
      null; -- bitta auksion xatosi boshqalarini to'xtatmasin; keyingi chaqiruvda qayta uriniladi
    end;
  end loop;
  return n;
end $$;

-- ---------- Admin ----------
create or replace function public.admin_create_auction(p_account uuid, p_start_price bigint, p_min_step bigint, p_duration_minutes int)
returns uuid language plpgsql security definer set search_path = public as $$
declare a public.accounts; v_id uuid;
begin
  perform public._require_admin();
  select * into a from public.accounts where id = p_account for update;
  if a.id is null then raise exception 'Akkaunt topilmadi'; end if;
  if a.status <> 'active' then raise exception 'Faqat sotuvdagi (active) akkauntni auksionga qo''yish mumkin'; end if;
  if coalesce(p_start_price, 0) < 1000 then raise exception 'Boshlang''ich narx kamida 1 000 so''m'; end if;
  if coalesce(p_min_step, 0) < 100 then raise exception 'Minimal qadam kamida 100 so''m'; end if;
  if coalesce(p_duration_minutes, 0) < 5 or p_duration_minutes > 60 * 24 * 14 then
    raise exception 'Davomiylik 5 daqiqadan 14 kungacha bo''lishi kerak';
  end if;
  update public.accounts set status = 'auction', updated_at = now() where id = a.id;
  insert into public.auctions(account_id, start_price, min_step, ends_at, created_by)
  values (a.id, p_start_price, p_min_step, now() + make_interval(mins => p_duration_minutes), auth.uid())
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.admin_cancel_auction(p_auction uuid) returns void
language plpgsql security definer set search_path = public as $$
declare au public.auctions; a public.accounts;
begin
  perform public._require_admin();
  select * into au from public.auctions where id = p_auction for update;
  if au.id is null or au.status <> 'live' then raise exception 'Faol auksion topilmadi'; end if;
  select * into a from public.accounts where id = au.account_id;
  if au.current_bidder is not null then
    perform public._add_balance(au.current_bidder, au.current_bid, 'bid_refund', '#' || a.public_no || ' auksion bekor qilindi');
  end if;
  update public.auctions set status = 'cancelled' where id = au.id;
  update public.accounts set status = 'active', updated_at = now() where id = au.account_id and status = 'auction';
end $$;

-- Admin uchun to'liq ro'yxat (taklifchi ID lari bilan)
create or replace function public.admin_auctions(p_limit int default 100) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform public._require_admin();
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', au.id, 'status', au.status, 'start_price', au.start_price, 'min_step', au.min_step,
      'current_bid', au.current_bid, 'bids_count', au.bids_count, 'ends_at', au.ends_at, 'created_at', au.created_at,
      'leader', (select jsonb_build_object('public_id', public_id, 'username', username, 'telegram', telegram) from public.profiles where id = au.current_bidder),
      'winner', (select jsonb_build_object('public_id', public_id, 'username', username, 'telegram', telegram) from public.profiles where id = au.winner_id),
      'account', jsonb_build_object('id', a.id, 'public_no', a.public_no, 'title', a.title, 'game', a.game, 'price', a.price, 'image_url', a.image_url)
    ) order by au.created_at desc)
    from (select * from public.auctions order by created_at desc limit least(greatest(coalesce(p_limit,100),1),500)) au
    join public.accounts a on a.id = au.account_id), '[]'::jsonb);
end $$;

-- ---------- Ruxsatlar ----------
revoke execute on function public._mask_name(text) from public, anon, authenticated;
grant execute on function public.auction_list(text, int)          to anon, authenticated;
grant execute on function public.auction_bids(uuid)               to anon, authenticated;
grant execute on function public.finalize_auctions()              to anon, authenticated;
grant execute on function public.place_bid(uuid, bigint)          to authenticated;
revoke execute on function public.place_bid(uuid, bigint)         from anon, public;
grant execute on function public.admin_create_auction(uuid, bigint, bigint, int) to authenticated;
grant execute on function public.admin_cancel_auction(uuid)       to authenticated;
grant execute on function public.admin_auctions(int)              to authenticated;
revoke execute on function public.admin_create_auction(uuid, bigint, bigint, int), public.admin_cancel_auction(uuid),
  public.admin_auctions(int) from anon, public;

-- >>>>>>>>>>>>>>>> 18_frames.sql <<<<<<<<<<<<<<<<
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

-- >>>>>>>>>>>>>>>> 19_frame_styles.sql <<<<<<<<<<<<<<<<
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

-- >>>>>>>>>>>>>>>> 20_orders.sql <<<<<<<<<<<<<<<<
-- ============================================================
--  UzDrop v20 — ARIZALAR (19 dan keyin)
--  Xarid endi darhol kod bermaydi, ARIZA yaratadi:
--   1) "pending": pul ushlab turiladi, akkaunt band. 5 daqiqa ichida mijoz bekor qila oladi
--      (adashib boshqa akkauntni olgan bo'lsa) — pul to'liq qaytadi.
--   2) 5 daqiqadan keyin ariza admin panelga tushadi. Admin "Tasdiqlash" → haqiqiy
--      maxfiy kod (UZ-XXXX-XXXX) yaratiladi, holat "waiting" — mijozga kod va mas'ul admin ko'rinadi.
--      Admin "Rad etish" → pul qaytadi, akkaunt sotuvga qaytadi.
--   3) Keyingi qadamlar avvalgidek: admin kodni tekshiradi → "Topshirildi".
-- ============================================================
alter table public.deliveries drop constraint if exists deliveries_status_check;
alter table public.deliveries add constraint deliveries_status_check
  check (status in ('pending','waiting','delivered','cancelled'));
alter table public.deliveries add column if not exists approved_at timestamptz;
alter table public.deliveries add column if not exists approved_by uuid references public.profiles(id) on delete set null;
create index if not exists deliveries_pending_idx on public.deliveries(status, created_at) where status = 'pending';

-- Bekor qilish muddati (daqiqa)
create or replace function public._order_grace() returns interval language sql immutable as $$ select interval '5 minutes' $$;

-- ---------- Xarid → ariza ----------
create or replace function public.buy_account(p_account uuid) returns text
language plpgsql security definer set search_path = public as $$
declare a public.accounts; v_bal bigint; v_code text;
begin
  if auth.uid() is null then raise exception 'Avval tizimga kiring'; end if;
  select * into a from public.accounts where id = p_account for update;
  if a.id is null or a.status <> 'active' then raise exception 'Akkaunt sotuvda emas'; end if;
  if a.seller_id = auth.uid() then raise exception 'O''z akkauntingizni sotib ololmaysiz'; end if;
  if (select count(*) from public.deliveries where user_id = auth.uid() and status = 'pending') >= 5 then
    raise exception 'Sizda 5 ta ko''rib chiqilayotgan ariza bor. Avval ular tasdiqlanishini kuting.';
  end if;
  select balance into v_bal from public.profiles where id = auth.uid() for update;
  if v_bal < a.price then raise exception 'Balans yetarli emas'; end if;

  perform public._add_balance(auth.uid(), -a.price, 'buy', '#' || a.public_no || ' ' || a.title);
  update public.accounts set status = 'sold', owner_id = auth.uid(), updated_at = now() where id = a.id;
  loop
    v_code := public._gen_code('ARZ');
    begin
      insert into public.deliveries(code, user_id, account_id, source, price, status)
      values (v_code, auth.uid(), a.id, 'buy', a.price, 'pending');
      return v_code;
    exception when unique_violation then null;
    end;
  end loop;
end $$;
grant execute on function public.buy_account(uuid) to authenticated;

-- ---------- Mijoz: arizani bekor qilish (faqat 5 daqiqa ichida) ----------
create or replace function public.cancel_order(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare d public.deliveries;
begin
  if auth.uid() is null then raise exception 'Avval tizimga kiring'; end if;
  select * into d from public.deliveries where id = p_order and user_id = auth.uid() for update;
  if d.id is null then raise exception 'Ariza topilmadi'; end if;
  if d.status <> 'pending' then raise exception 'Bu arizani endi bekor qilib bo''lmaydi'; end if;
  if d.created_at < now() - public._order_grace() then
    raise exception 'Bekor qilish muddati (5 daqiqa) tugagan — ariza admin tomonidan ko''rib chiqilmoqda';
  end if;
  update public.deliveries set status = 'cancelled', done_at = now(), admin_note = 'Mijoz bekor qildi' where id = d.id;
  perform public._add_balance(d.user_id, d.price, 'refund', 'Ariza bekor qilindi: ' || d.code);
  update public.accounts set status = 'active', owner_id = null, updated_at = now() where id = d.account_id and status = 'sold';
end $$;
grant execute on function public.cancel_order(uuid) to authenticated;
revoke execute on function public.cancel_order(uuid) from anon, public;

-- ---------- Admin: ko'rib chiqiladigan arizalar (5 daqiqadan o'tganlar) ----------
create or replace function public.admin_orders() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform public._require_admin();
  return jsonb_build_object(
    'cooling', (select count(*) from public.deliveries where status = 'pending' and created_at > now() - public._order_grace()),
    'items', coalesce((select jsonb_agg(jsonb_build_object(
        'id', d.id, 'code', d.code, 'price', d.price, 'created_at', d.created_at,
        'user', jsonb_build_object('public_id', p.public_id, 'username', p.username, 'email', p.email, 'telegram', p.telegram),
        'account', jsonb_build_object('id', a.id, 'public_no', a.public_no, 'title', a.title, 'game', a.game,
            'image_url', a.image_url, 'frame', a.frame, 'admin_id', a.admin_id),
        'admin', (select jsonb_build_object('username', ap.username, 'telegram', ap.telegram) from public.profiles ap where ap.id = a.admin_id)
      ) order by d.created_at)
      from public.deliveries d
      join public.profiles p on p.id = d.user_id
      join public.accounts a on a.id = d.account_id
      where d.status = 'pending' and d.created_at <= now() - public._order_grace()), '[]'::jsonb));
end $$;

-- ---------- Admin: tasdiqlash → haqiqiy kod ----------
create or replace function public.admin_approve_order(p_order uuid) returns text
language plpgsql security definer set search_path = public as $$
declare d public.deliveries; v_code text;
begin
  perform public._require_admin();
  select * into d from public.deliveries where id = p_order for update;
  if d.id is null or d.status <> 'pending' then raise exception 'Ariza topilmadi yoki allaqachon ko''rib chiqilgan'; end if;
  if d.created_at > now() - public._order_grace() then raise exception 'Mijozning bekor qilish muddati hali tugamagan'; end if;
  loop
    v_code := public._gen_code('UZ');
    begin
      update public.deliveries set code = v_code, status = 'waiting', approved_at = now(), approved_by = auth.uid() where id = d.id;
      return v_code;
    exception when unique_violation then null;
    end;
  end loop;
end $$;

-- ---------- Admin: rad etish → pul qaytadi ----------
create or replace function public.admin_reject_order(p_order uuid, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare d public.deliveries;
begin
  perform public._require_admin();
  select * into d from public.deliveries where id = p_order for update;
  if d.id is null or d.status <> 'pending' then raise exception 'Ariza topilmadi yoki allaqachon ko''rib chiqilgan'; end if;
  update public.deliveries set status = 'cancelled', done_at = now(), admin_note = coalesce(nullif(trim(p_note), ''), 'Admin rad etdi') where id = d.id;
  perform public._add_balance(d.user_id, d.price, 'refund', 'Ariza rad etildi: ' || d.code);
  update public.accounts set status = 'active', owner_id = null, updated_at = now() where id = d.account_id and status = 'sold';
end $$;

grant execute on function public.admin_orders()                    to authenticated;
grant execute on function public.admin_approve_order(uuid)         to authenticated;
grant execute on function public.admin_reject_order(uuid, text)    to authenticated;
revoke execute on function public.admin_orders(), public.admin_approve_order(uuid), public.admin_reject_order(uuid, text) from anon, public;

-- >>>>>>>>>>>>>>>> 21_bindings.sql <<<<<<<<<<<<<<<<
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
