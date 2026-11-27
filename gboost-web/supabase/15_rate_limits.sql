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
