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
