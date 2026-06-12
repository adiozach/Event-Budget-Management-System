-- ============================================================
-- 006: Audit trail + lock approved expenses
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- ---- 1) AUDIT LOG (append-only) ----
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  user_email text,
  action text not null,           -- e.g. 'expense.approve', 'event.delete'
  entity_type text,               -- 'expense' | 'income' | 'event' | 'profile' | 'budget'
  entity_id uuid,
  details text,                   -- human-readable summary
  created_at timestamptz default now()
);

alter table audit_log enable row level security;

-- Any authenticated user can read the history (accountability) ...
create policy "audit read" on audit_log for select
  using (auth.role() = 'authenticated');
-- ... and append to it. There is NO update/delete policy on purpose:
-- the log is immutable — not even admins can rewrite history via the API.
create policy "audit insert" on audit_log for insert
  with check (auth.role() = 'authenticated');

-- ---- 2) LOCK APPROVED EXPENSES ----
-- Replace the broad write policy. Treasurers may only modify/delete
-- PENDING expenses; admins may modify/delete any (e.g. corrections).
-- Note: the approve/reject action itself is allowed because the row is
-- still 'pending' at the moment of that update.

drop policy if exists "write expenses" on expenses;

create policy "expenses insert" on expenses for insert
  with check (auth.role() = 'authenticated');

create policy "expenses update" on expenses for update
  using (approval_status = 'pending' or is_admin())
  with check (auth.role() = 'authenticated');

create policy "expenses delete" on expenses for delete
  using (approval_status = 'pending' or is_admin());
