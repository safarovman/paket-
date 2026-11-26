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
