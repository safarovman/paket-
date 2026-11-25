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
