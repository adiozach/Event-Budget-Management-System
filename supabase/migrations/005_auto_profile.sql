-- ============================================================
-- 005: Auto-create a profile when a new auth user is created.
--   New users get role 'treasurer' by default (least privilege).
--   An admin can then promote them in the app's Settings page.
--   This means: NO SQL needed to add future users — just create
--   them in Supabase Auth and set their role in the app.
-- Run this in the Supabase SQL Editor.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(nullif(split_part(new.email, '@', 1), ''), 'New User'),
    coalesce(new.email, ''),
    'treasurer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
