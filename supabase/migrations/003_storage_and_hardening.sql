-- ============================================================
-- 003: Storage policies for receipts + tighter event deletion
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- ---- Storage: allow authenticated users to use the 'receipts' bucket ----
-- (The bucket is private; without these policies, uploads/reads are denied.)

create policy "receipts: authenticated read"
  on storage.objects for select
  using (bucket_id = 'receipts' and auth.role() = 'authenticated');

create policy "receipts: authenticated upload"
  on storage.objects for insert
  with check (bucket_id = 'receipts' and auth.role() = 'authenticated');

create policy "receipts: authenticated update"
  on storage.objects for update
  using (bucket_id = 'receipts' and auth.role() = 'authenticated');

create policy "receipts: authenticated delete"
  on storage.objects for delete
  using (bucket_id = 'receipts' and auth.role() = 'authenticated');

-- ---- Restrict EVENT DELETION to admins only (matches the spec) ----
-- Replace the broad "write events" policy with split policies so that
-- treasurers can create/edit events but only admins can delete them.

drop policy if exists "write events" on events;

create policy "events insert" on events for insert
  with check (auth.role() = 'authenticated');

create policy "events update" on events for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "events delete (admin only)" on events for delete
  using (is_admin());
