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
