-- Organizations: exactly two rows
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);
insert into organizations (name) values ('GBC'), ('BVBC');

-- User profiles (auth handled by Supabase Auth; this holds role)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('admin', 'treasurer'))
);

create table events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  event_date date,
  location text default 'Lucena City, Quezon',
  status text not null default 'planning' check (status in ('planning','active','closed')),
  overall_budget numeric(12,2),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table budget_categories (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  planned_amount numeric(12,2) not null default 0 check (planned_amount >= 0)
);

create table receipts (
  id uuid primary key default gen_random_uuid(),
  file_path text not null,
  uploaded_by uuid references profiles(id),
  linked_type text not null check (linked_type in ('expense','income')),
  linked_id uuid,
  created_at timestamptz default now()
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  category_id uuid references budget_categories(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  expense_date date not null default current_date,
  description text,
  paid_by text,
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected')),
  approved_by uuid references profiles(id),
  receipt_id uuid references receipts(id) on delete set null,
  created_at timestamptz default now()
);

create table income (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  income_date date not null default current_date,
  source text not null,
  description text,
  receipt_id uuid references receipts(id) on delete set null,
  created_at timestamptz default now()
);
