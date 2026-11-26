-- ============================================================
--  UzDrop v13 — BEPUL TARIF LIMITLARI (12 dan keyin)
--  Admin panel → Statistika: baza hajmi, fayllar, faol foydalanuvchilar.
-- ============================================================
create or replace function public.admin_usage() returns jsonb
language plpgsql stable security definer set search_path = public, storage, auth as $$
begin
  perform public._require_admin();
  return jsonb_build_object(
    'db_bytes',       pg_database_size(current_database()),
    'storage_bytes',  coalesce((select sum((metadata->>'size')::bigint) from storage.objects), 0),
    'storage_files',  (select count(*) from storage.objects),
    'mau',            (select count(*) from auth.users where last_sign_in_at > now() - interval '30 days'),
    'users',          (select count(*) from auth.users),
    'tables', coalesce((
      select jsonb_agg(jsonb_build_object('name', s.relname, 'bytes', pg_total_relation_size(c.oid), 'rows', s.n_live_tup) order by pg_total_relation_size(c.oid) desc)
      from pg_stat_user_tables s join pg_class c on c.oid = s.relid
      where s.schemaname = 'public'), '[]'::jsonb)
  );
end $$;
revoke execute on function public.admin_usage() from anon, public;
grant execute on function public.admin_usage() to authenticated;
