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
