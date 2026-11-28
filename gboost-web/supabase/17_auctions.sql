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
