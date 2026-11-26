-- ============================================================
--  UzDrop v8 — PROFIL KAFOLATI (07 dan keyin)
--  Agar biror sabab bilan foydalanuvchining profili (ID raqami, balansi) yaratilmagan
--  bo'lsa, sayt kirganda uni avtomatik yaratadi.
-- ============================================================

-- Yetishmayotgan barcha profillarni hozir yaratish
insert into public.profiles (id, username, email)
select id, coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)), email
from auth.users
on conflict (id) do nothing;

-- Email bo'sh qolgan profillarni to'ldirish
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;

-- Sayt chaqiradigan funksiya: o'z profilingiz yo'q bo'lsa yaratadi
create or replace function public.ensure_profile() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.profiles (id, username, email)
  select id, coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)), email
  from auth.users where id = auth.uid()
  on conflict (id) do nothing;
end $$;
grant execute on function public.ensure_profile() to authenticated;
