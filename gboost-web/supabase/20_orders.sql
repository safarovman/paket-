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
