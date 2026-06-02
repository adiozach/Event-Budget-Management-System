-- ============================================================
-- 004: Rename organizations to the client's names
--   Church -> GBC  (Grace Baptist Church)
--   School -> BVBC
-- Run this in the Supabase SQL Editor.
-- ============================================================

update organizations set name = 'GBC'  where name = 'Church';
update organizations set name = 'BVBC' where name = 'School';
