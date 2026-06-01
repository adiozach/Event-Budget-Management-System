-- Enable RLS
alter table profiles enable row level security;
alter table organizations enable row level security;
alter table events enable row level security;
alter table budget_categories enable row level security;
alter table expenses enable row level security;
alter table income enable row level security;
alter table receipts enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin() returns boolean as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

-- Any authenticated user (admin or treasurer) may read reference + data tables
create policy "read orgs" on organizations for select using (auth.role() = 'authenticated');
create policy "read events" on events for select using (auth.role() = 'authenticated');
create policy "read categories" on budget_categories for select using (auth.role() = 'authenticated');
create policy "read expenses" on expenses for select using (auth.role() = 'authenticated');
create policy "read income" on income for select using (auth.role() = 'authenticated');
create policy "read receipts" on receipts for select using (auth.role() = 'authenticated');

-- Both roles may write events/categories/expenses/income/receipts
create policy "write events" on events for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "write categories" on budget_categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "write expenses" on expenses for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "write income" on income for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "write receipts" on receipts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Profiles: a user can read all profiles, but only admins may insert/update/delete
create policy "read profiles" on profiles for select using (auth.role() = 'authenticated');
create policy "admin manage profiles" on profiles for all using (is_admin()) with check (is_admin());
