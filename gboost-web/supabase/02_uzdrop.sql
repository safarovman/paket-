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
