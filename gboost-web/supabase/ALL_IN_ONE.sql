-- ============================================================
--  UzDrop — BITTA FAYLDA HAMMASI (01…11 birlashtirilgan)
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
