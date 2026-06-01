# Event Budget Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Windows desktop app (Electron + React + Supabase) for tracking church and school event budgets in Philippine Peso, with expense approval, receipts, and printable reports.

**Architecture:** An Electron desktop shell renders a React UI. All shared data, authentication, and receipt files live in Supabase (Postgres + Auth + Storage, free tier). Pure money-math logic is isolated in tested modules; UI features are split by domain (auth, events, expenses, income, reports).

**Tech Stack:** Electron, React, Vite, Supabase (`@supabase/supabase-js`), Vitest + @testing-library/react (tests), `jspdf` + `jspdf-autotable` (PDF), `xlsx` (Excel), `electron-builder` (packaging).

---

## File Structure

```
BUDGET TRACKER/
├── package.json
├── vite.config.js
├── electron-builder.yml
├── .env.example                  # Supabase URL + anon key placeholders
├── electron/
│   ├── main.js                   # Electron main process, creates window
│   └── preload.js                # Safe bridge (exposes nothing sensitive)
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql        # tables
│       └── 002_rls.sql           # row-level security policies
├── src/
│   ├── main.jsx                  # React entry
│   ├── App.jsx                   # top-level router/state
│   ├── lib/
│   │   ├── supabase.js           # configured Supabase client
│   │   ├── money.js              # PURE money math (tested)
│   │   └── format.js             # peso formatting (tested)
│   ├── features/
│   │   ├── auth/LoginScreen.jsx
│   │   ├── auth/useAuth.js
│   │   ├── orgs/OrgPicker.jsx
│   │   ├── events/EventsList.jsx
│   │   ├── events/EventDetail.jsx
│   │   ├── events/eventTotals.js # composes money.js over an event (tested)
│   │   ├── budget/BudgetTab.jsx
│   │   ├── expenses/ExpensesTab.jsx
│   │   ├── income/IncomeTab.jsx
│   │   ├── receipts/uploadReceipt.js
│   │   ├── reports/ReportsTab.jsx
│   │   ├── reports/buildReportModel.js  # PURE report data (tested)
│   │   ├── reports/exportPdf.js
│   │   ├── reports/exportExcel.js
│   │   └── settings/SettingsScreen.jsx
│   └── components/               # shared UI (Banner, Money input, Table)
└── tests/
    ├── money.test.js
    ├── format.test.js
    ├── eventTotals.test.js
    └── buildReportModel.test.js
```

**Decomposition rationale:** All money calculations are pure functions in `lib/money.js`, `features/events/eventTotals.js`, and `features/reports/buildReportModel.js` — no UI, no network — so they can be unit-tested exhaustively (the spec calls money math "the heart of the app"). UI features are split by domain so each file stays focused.

---

## Phase 0 — Project Scaffold

### Task 0.1: Initialize the project

**Files:**
- Create: `package.json`, `vite.config.js`, `.gitignore`, `.env.example`

- [ ] **Step 1: Initialize git and npm**

```bash
git init
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install react react-dom @supabase/supabase-js jspdf jspdf-autotable xlsx
npm install -D electron electron-builder vite @vitejs/plugin-react vitest @testing-library/react @testing-library/jest-dom jsdom concurrently wait-on
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
dist/
dist-electron/
release/
.env
```

- [ ] **Step 4: Create `.env.example`**

```
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 5: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist' },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
  },
});
```

- [ ] **Step 6: Configure `package.json` scripts**

Set `"main": "electron/main.js"` and add scripts:

```json
{
  "scripts": {
    "dev:vite": "vite",
    "dev": "concurrently -k \"vite\" \"wait-on tcp:5173 && electron .\"",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "package": "vite build && electron-builder"
  }
}
```

- [ ] **Step 7: Create `tests/setup.js`**

```js
import '@testing-library/jest-dom';
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold project (electron, react, vite, vitest)"
```

### Task 0.2: Minimal Electron window showing React

**Files:**
- Create: `electron/main.js`, `electron/preload.js`, `index.html`, `src/main.jsx`, `src/App.jsx`

- [ ] **Step 1: Create `electron/main.js`**

```js
const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

- [ ] **Step 2: Create `electron/preload.js`**

```js
// No privileged APIs are exposed to the renderer; the app talks to
// Supabase directly over HTTPS from the renderer using the anon key.
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('appInfo', { platform: process.platform });
```

- [ ] **Step 3: Create `index.html`**

```html
<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Event Budget Tracker</title></head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create `src/main.jsx`**

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(<App />);
```

- [ ] **Step 5: Create `src/App.jsx`**

```jsx
import React from 'react';

export default function App() {
  return <h1>Event Budget Tracker — Church &amp; School (Lucena City)</h1>;
}
```

- [ ] **Step 6: Run the app**

Run: `npm run dev`
Expected: An Electron window opens showing the heading text.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: minimal electron window rendering react app"
```

---

## Phase 1 — Core Money Logic (TDD)

### Task 1.1: Peso formatting

**Files:**
- Create: `src/lib/format.js`
- Test: `tests/format.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { formatPeso } from '../src/lib/format.js';

describe('formatPeso', () => {
  it('formats whole numbers with peso sign and 2 decimals', () => {
    expect(formatPeso(1234)).toBe('₱1,234.00');
  });
  it('formats decimals and thousands separators', () => {
    expect(formatPeso(1234.5)).toBe('₱1,234.50');
  });
  it('formats zero', () => {
    expect(formatPeso(0)).toBe('₱0.00');
  });
  it('formats negatives with sign before the peso', () => {
    expect(formatPeso(-50)).toBe('-₱50.00');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- format`
Expected: FAIL — `formatPeso is not a function`.

- [ ] **Step 3: Write minimal implementation**

```js
export function formatPeso(amount) {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}₱${formatted}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- format`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.js tests/format.test.js
git commit -m "feat: peso formatting helper with tests"
```

### Task 1.2: Money math primitives

**Files:**
- Create: `src/lib/money.js`
- Test: `tests/money.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { sumAmounts, totalPlanned, totalSpent, totalIncome, netBalance } from '../src/lib/money.js';

describe('money math', () => {
  it('sumAmounts adds amounts, ignoring nullish', () => {
    expect(sumAmounts([{ amount: 100 }, { amount: 50.5 }, { amount: null }])).toBe(150.5);
  });
  it('sumAmounts returns 0 for empty list', () => {
    expect(sumAmounts([])).toBe(0);
  });
  it('totalPlanned sums category planned_amount', () => {
    expect(totalPlanned([{ planned_amount: 500 }, { planned_amount: 200 }])).toBe(700);
  });
  it('totalSpent only counts approved expenses', () => {
    const expenses = [
      { amount: 100, approval_status: 'approved' },
      { amount: 999, approval_status: 'pending' },
      { amount: 50, approval_status: 'approved' },
      { amount: 12, approval_status: 'rejected' },
    ];
    expect(totalSpent(expenses)).toBe(150);
  });
  it('totalIncome sums all income', () => {
    expect(totalIncome([{ amount: 1000 }, { amount: 250 }])).toBe(1250);
  });
  it('netBalance = income - approved spend', () => {
    expect(netBalance(1250, 150)).toBe(1100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- money`
Expected: FAIL — functions not defined.

- [ ] **Step 3: Write minimal implementation**

```js
export function sumAmounts(rows, key = 'amount') {
  return rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
}

export function totalPlanned(categories) {
  return sumAmounts(categories, 'planned_amount');
}

export function totalSpent(expenses) {
  return sumAmounts(expenses.filter((e) => e.approval_status === 'approved'));
}

export function totalIncome(income) {
  return sumAmounts(income);
}

export function netBalance(income, spent) {
  return income - spent;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- money`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/money.js tests/money.test.js
git commit -m "feat: core money math primitives with tests"
```

### Task 1.3: Event totals + budget-vs-actual

**Files:**
- Create: `src/features/events/eventTotals.js`
- Test: `tests/eventTotals.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { computeEventTotals, budgetVsActual } from '../src/features/events/eventTotals.js';

const categories = [
  { id: 'c1', name: 'Food', planned_amount: 500 },
  { id: 'c2', name: 'Decor', planned_amount: 200 },
];
const expenses = [
  { amount: 300, category_id: 'c1', approval_status: 'approved' },
  { amount: 100, category_id: 'c1', approval_status: 'pending' },
  { amount: 250, category_id: 'c2', approval_status: 'approved' },
];
const income = [{ amount: 1000 }, { amount: 200 }];

describe('computeEventTotals', () => {
  it('computes planned, spent (approved), income, balance', () => {
    expect(computeEventTotals({ categories, expenses, income })).toEqual({
      totalPlanned: 700,
      totalSpent: 550,
      totalIncome: 1200,
      netBalance: 650,
    });
  });
});

describe('budgetVsActual', () => {
  it('produces per-category planned/spent/difference using approved spend', () => {
    expect(budgetVsActual(categories, expenses)).toEqual([
      { id: 'c1', name: 'Food', planned: 500, spent: 300, difference: 200 },
      { id: 'c2', name: 'Decor', planned: 200, spent: 250, difference: -50 },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- eventTotals`
Expected: FAIL — functions not defined.

- [ ] **Step 3: Write minimal implementation**

```js
import { totalPlanned, totalSpent, totalIncome, netBalance, sumAmounts } from '../../lib/money.js';

export function computeEventTotals({ categories, expenses, income }) {
  const planned = totalPlanned(categories);
  const spent = totalSpent(expenses);
  const incomeTotal = totalIncome(income);
  return {
    totalPlanned: planned,
    totalSpent: spent,
    totalIncome: incomeTotal,
    netBalance: netBalance(incomeTotal, spent),
  };
}

export function budgetVsActual(categories, expenses) {
  return categories.map((cat) => {
    const approvedForCat = expenses.filter(
      (e) => e.category_id === cat.id && e.approval_status === 'approved'
    );
    const spent = sumAmounts(approvedForCat);
    return {
      id: cat.id,
      name: cat.name,
      planned: cat.planned_amount,
      spent,
      difference: cat.planned_amount - spent,
    };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- eventTotals`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/events/eventTotals.js tests/eventTotals.test.js
git commit -m "feat: event totals and budget-vs-actual with tests"
```

---

## Phase 2 — Supabase Backend

### Task 2.1: Create the database schema

**Files:**
- Create: `supabase/migrations/001_schema.sql`

> **Manual prerequisite:** Create a free Supabase project at supabase.com. Copy the Project URL and anon key into a local `.env` file (based on `.env.example`). Run the SQL below in the Supabase SQL Editor.

- [ ] **Step 1: Write `supabase/migrations/001_schema.sql`**

```sql
-- Organizations: exactly two rows
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);
insert into organizations (name) values ('Church'), ('School');

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
```

- [ ] **Step 2: Run the migration in Supabase SQL Editor**

Expected: All tables created; `organizations` contains `Church` and `School`.

- [ ] **Step 3: Create the receipts storage bucket**

In Supabase Storage, create a bucket named `receipts` (private). Note it for Phase 8.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/001_schema.sql
git commit -m "feat: supabase database schema"
```

### Task 2.2: Row-Level Security policies

**Files:**
- Create: `supabase/migrations/002_rls.sql`

- [ ] **Step 1: Write `supabase/migrations/002_rls.sql`**

```sql
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
```

- [ ] **Step 2: Run the migration in Supabase SQL Editor**

Expected: Policies created, no errors.

- [ ] **Step 3: Create the first admin user manually**

In Supabase Auth, add a user (your email + password). Then in SQL Editor:

```sql
insert into profiles (id, name, email, role)
values ('<paste-auth-user-id>', 'Allan Chester Lagrason', '<your-email>', 'admin');
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/002_rls.sql
git commit -m "feat: row-level security policies and admin bootstrap"
```

### Task 2.3: Supabase client

**Files:**
- Create: `src/lib/supabase.js`

- [ ] **Step 1: Write `src/lib/supabase.js`**

```js
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});
```

- [ ] **Step 2: Verify it loads**

Add a temporary `console.log(!!supabase)` in `App.jsx`, run `npm run dev`, confirm `true` in DevTools, then remove the log.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.js
git commit -m "feat: configured supabase client"
```

---

## Phase 3 — Authentication

### Task 3.1: Auth hook

**Files:**
- Create: `src/features/auth/useAuth.js`

- [ ] **Step 1: Write `src/features/auth/useAuth.js`**

```js
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [session]);

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signOut = () => supabase.auth.signOut();

  return { session, profile, loading, signIn, signOut };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/auth/useAuth.js
git commit -m "feat: useAuth hook for session and profile"
```

### Task 3.2: Login screen with friendly errors

**Files:**
- Create: `src/features/auth/LoginScreen.jsx`

- [ ] **Step 1: Write `src/features/auth/LoginScreen.jsx`**

```jsx
import React, { useState } from 'react';

const FRIENDLY = {
  'Invalid login credentials': 'Wrong email or password.',
};

export default function LoginScreen({ onSignIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await onSignIn(email, password);
    if (error) setError(FRIENDLY[error.message] || error.message);
    setBusy(false);
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 320, margin: '80px auto' }}>
      <h2>Event Budget Tracker</h2>
      <input type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={password}
        onChange={(e) => setPassword(e.target.value)} required />
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <button disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
```

- [ ] **Step 2: Wire into `src/App.jsx`**

```jsx
import React from 'react';
import { useAuth } from './features/auth/useAuth.js';
import LoginScreen from './features/auth/LoginScreen.jsx';

export default function App() {
  const { session, profile, loading, signIn, signOut } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (!session) return <LoginScreen onSignIn={signIn} />;
  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: 12 }}>
        <strong>Welcome, {profile?.name} ({profile?.role})</strong>
        <button onClick={signOut}>Sign out</button>
      </header>
      <main style={{ padding: 12 }}><p>Signed in. Org picker comes next.</p></main>
    </div>
  );
}
```

- [ ] **Step 3: Manually verify**

Run `npm run dev`. Sign in with the admin user from Task 2.2. Confirm the welcome header shows your name and `admin`. Try a wrong password → "Wrong email or password." Sign out returns to login.

- [ ] **Step 4: Commit**

```bash
git add src/features/auth/LoginScreen.jsx src/App.jsx
git commit -m "feat: login screen with friendly errors"
```

---

## Phase 4 — Organization Picker & Events List

### Task 4.1: Organization picker

**Files:**
- Create: `src/features/orgs/OrgPicker.jsx`

- [ ] **Step 1: Write `src/features/orgs/OrgPicker.jsx`**

```jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';

export default function OrgPicker({ onPick }) {
  const [orgs, setOrgs] = useState([]);
  useEffect(() => {
    supabase.from('organizations').select('*').order('name')
      .then(({ data }) => setOrgs(data || []));
  }, []);
  return (
    <div style={{ padding: 24 }}>
      <h2>Choose an organization</h2>
      {orgs.map((o) => (
        <button key={o.id} onClick={() => onPick(o)} style={{ margin: 8, padding: 16 }}>
          {o.name}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/orgs/OrgPicker.jsx
git commit -m "feat: organization picker"
```

### Task 4.2: Events list with quick totals

**Files:**
- Create: `src/features/events/EventsList.jsx`

- [ ] **Step 1: Write `src/features/events/EventsList.jsx`**

```jsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase.js';
import { computeEventTotals } from './eventTotals.js';
import { formatPeso } from '../../lib/format.js';

export default function EventsList({ org, onOpen }) {
  const [events, setEvents] = useState([]);
  const [name, setName] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('events')
      .select('*, budget_categories(*), expenses(*), income(*)')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false });
    setEvents(data || []);
  }, [org.id]);

  useEffect(() => { load(); }, [load]);

  async function addEvent(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await supabase.from('events').insert({ organization_id: org.id, name: name.trim() });
    setName('');
    load();
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>{org.name} — Events</h2>
      <form onSubmit={addEvent}>
        <input placeholder="New event name" value={name} onChange={(e) => setName(e.target.value)} />
        <button>+ New Event</button>
      </form>
      <table border="1" cellPadding="6" style={{ marginTop: 12, width: '100%' }}>
        <thead><tr><th>Event</th><th>Status</th><th>Planned</th><th>Spent</th><th>Income</th><th>Balance</th><th></th></tr></thead>
        <tbody>
          {events.map((ev) => {
            const t = computeEventTotals({
              categories: ev.budget_categories || [],
              expenses: ev.expenses || [],
              income: ev.income || [],
            });
            return (
              <tr key={ev.id}>
                <td>{ev.name}</td>
                <td>{ev.status}</td>
                <td>{formatPeso(t.totalPlanned)}</td>
                <td>{formatPeso(t.totalSpent)}</td>
                <td>{formatPeso(t.totalIncome)}</td>
                <td>{formatPeso(t.netBalance)}</td>
                <td><button onClick={() => onOpen(ev)}>Open</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Wire org picker + events list into `App.jsx`**

Add `const [org, setOrg] = useState(null)` and `const [openEvent, setOpenEvent] = useState(null)`. After sign-in: if no `org`, render `<OrgPicker onPick={setOrg} />`; else if no `openEvent`, render `<EventsList org={org} onOpen={setOpenEvent} />`; else render the event detail (Phase 5). Add a "Change org" button that calls `setOrg(null)`.

- [ ] **Step 3: Manually verify**

Run `npm run dev`. Pick Church → see empty events table → add "Fiesta 2026" → it appears with all totals at ₱0.00.

- [ ] **Step 4: Commit**

```bash
git add src/features/events/EventsList.jsx src/App.jsx
git commit -m "feat: events list with quick totals and create"
```

---

## Phase 5 — Event Detail & Budget Tab

### Task 5.1: Event detail shell with tabs + Overview

**Files:**
- Create: `src/features/events/EventDetail.jsx`

- [ ] **Step 1: Write `src/features/events/EventDetail.jsx`**

```jsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase.js';
import { computeEventTotals } from './eventTotals.js';
import { formatPeso } from '../../lib/format.js';
import BudgetTab from '../budget/BudgetTab.jsx';
import ExpensesTab from '../expenses/ExpensesTab.jsx';
import IncomeTab from '../income/IncomeTab.jsx';
import ReportsTab from '../reports/ReportsTab.jsx';

const TABS = ['Overview', 'Budget', 'Expenses', 'Income', 'Reports'];

export default function EventDetail({ event, profile, onBack }) {
  const [tab, setTab] = useState('Overview');
  const [data, setData] = useState({ categories: [], expenses: [], income: [] });

  const load = useCallback(async () => {
    const [{ data: categories }, { data: expenses }, { data: income }] = await Promise.all([
      supabase.from('budget_categories').select('*').eq('event_id', event.id),
      supabase.from('expenses').select('*').eq('event_id', event.id),
      supabase.from('income').select('*').eq('event_id', event.id),
    ]);
    setData({ categories: categories || [], expenses: expenses || [], income: income || [] });
  }, [event.id]);

  useEffect(() => { load(); }, [load]);

  const totals = computeEventTotals(data);

  return (
    <div style={{ padding: 16 }}>
      <button onClick={onBack}>← Back to events</button>
      <h2>{event.name}</h2>
      <nav>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ fontWeight: tab === t ? 'bold' : 'normal', marginRight: 8 }}>{t}</button>
        ))}
      </nav>
      <hr />
      {tab === 'Overview' && (
        <div>
          <p>Total Planned: {formatPeso(totals.totalPlanned)}</p>
          <p>Total Spent (approved): {formatPeso(totals.totalSpent)}</p>
          <p>Total Income: {formatPeso(totals.totalIncome)}</p>
          <p><strong>Net Balance: {formatPeso(totals.netBalance)}</strong></p>
          <div style={{ background: '#eee', width: 300, height: 20 }}>
            <div style={{
              background: totals.totalSpent > totals.totalPlanned ? 'crimson' : 'seagreen',
              width: Math.min(300, totals.totalPlanned ? (totals.totalSpent / totals.totalPlanned) * 300 : 0),
              height: 20,
            }} />
          </div>
        </div>
      )}
      {tab === 'Budget' && <BudgetTab event={event} categories={data.categories} onChange={load} />}
      {tab === 'Expenses' && <ExpensesTab event={event} data={data} profile={profile} onChange={load} />}
      {tab === 'Income' && <IncomeTab event={event} income={data.income} onChange={load} />}
      {tab === 'Reports' && <ReportsTab event={event} data={data} profile={profile} />}
    </div>
  );
}
```

- [ ] **Step 2: Render `EventDetail` from `App.jsx`**

When `openEvent` is set, render `<EventDetail event={openEvent} profile={profile} onBack={() => setOpenEvent(null)} />`.

- [ ] **Step 3: Commit**

```bash
git add src/features/events/EventDetail.jsx src/App.jsx
git commit -m "feat: event detail shell with tabs and overview"
```

> **Note:** The app will not compile until the four tab files exist. Create empty placeholder components returning `null` for `BudgetTab`, `ExpensesTab`, `IncomeTab`, `ReportsTab` now, then fill them in the following tasks. Commit the placeholders with this task.

### Task 5.2: Budget tab (categories CRUD)

**Files:**
- Create/replace: `src/features/budget/BudgetTab.jsx`

- [ ] **Step 1: Write `src/features/budget/BudgetTab.jsx`**

```jsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { formatPeso } from '../../lib/format.js';

export default function BudgetTab({ event, categories, onChange }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  async function add(e) {
    e.preventDefault();
    const planned = parseFloat(amount);
    if (!name.trim() || isNaN(planned) || planned < 0) return;
    await supabase.from('budget_categories')
      .insert({ event_id: event.id, name: name.trim(), planned_amount: planned });
    setName(''); setAmount(''); onChange();
  }

  async function remove(id) {
    await supabase.from('budget_categories').delete().eq('id', id);
    onChange();
  }

  return (
    <div>
      <form onSubmit={add}>
        <input placeholder="Category (e.g. Food)" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="number" min="0" step="0.01" placeholder="Planned ₱"
          value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button>Add category</button>
      </form>
      <table border="1" cellPadding="6" style={{ marginTop: 12 }}>
        <thead><tr><th>Category</th><th>Planned</th><th></th></tr></thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{formatPeso(c.planned_amount)}</td>
              <td><button onClick={() => remove(c.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Manually verify**

Open an event → Budget tab → add "Food" ₱500 and "Decor" ₱200. Overview tab shows Total Planned ₱700.00. Negative/blank inputs are rejected.

- [ ] **Step 3: Commit**

```bash
git add src/features/budget/BudgetTab.jsx
git commit -m "feat: budget categories tab with validation"
```

---

## Phase 6 — Expenses & Approval

### Task 6.1: Expenses tab with add + approve/reject

**Files:**
- Create/replace: `src/features/expenses/ExpensesTab.jsx`

- [ ] **Step 1: Write `src/features/expenses/ExpensesTab.jsx`**

```jsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { formatPeso } from '../../lib/format.js';

export default function ExpensesTab({ event, data, profile, onChange }) {
  const { categories, expenses } = data;
  const [form, setForm] = useState({
    amount: '', expense_date: '', description: '', paid_by: '', category_id: '',
  });

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function add(e) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount < 0) return;
    await supabase.from('expenses').insert({
      event_id: event.id,
      category_id: form.category_id || null,
      amount,
      expense_date: form.expense_date || new Date().toISOString().slice(0, 10),
      description: form.description,
      paid_by: form.paid_by,
      approval_status: 'pending',
    });
    setForm({ amount: '', expense_date: '', description: '', paid_by: '', category_id: '' });
    onChange();
  }

  async function decide(id, status) {
    await supabase.from('expenses')
      .update({ approval_status: status, approved_by: profile.id })
      .eq('id', id);
    onChange();
  }

  return (
    <div>
      <form onSubmit={add}>
        <input type="number" min="0" step="0.01" placeholder="Amount ₱"
          value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
        <input type="date" value={form.expense_date} onChange={(e) => set('expense_date', e.target.value)} />
        <input placeholder="Description" value={form.description} onChange={(e) => set('description', e.target.value)} />
        <input placeholder="Paid by" value={form.paid_by} onChange={(e) => set('paid_by', e.target.value)} />
        <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
          <option value="">(no category)</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button>Add expense</button>
      </form>
      <table border="1" cellPadding="6" style={{ marginTop: 12, width: '100%' }}>
        <thead><tr><th>Date</th><th>Description</th><th>Paid by</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {expenses.map((x) => (
            <tr key={x.id}>
              <td>{x.expense_date}</td>
              <td>{x.description}</td>
              <td>{x.paid_by}</td>
              <td>{formatPeso(x.amount)}</td>
              <td>{x.approval_status}</td>
              <td>
                {x.approval_status === 'pending' ? (
                  <>
                    <button onClick={() => decide(x.id, 'approved')}>Approve</button>
                    <button onClick={() => decide(x.id, 'rejected')}>Reject</button>
                  </>
                ) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Manually verify**

Add an expense ₱300 under Food (pending). Overview "Total Spent" stays ₱0.00 (not yet approved). Click Approve → Overview shows ₱300.00. Reject another → it never counts.

- [ ] **Step 3: Commit**

```bash
git add src/features/expenses/ExpensesTab.jsx
git commit -m "feat: expenses tab with approval workflow"
```

---

## Phase 7 — Income

### Task 7.1: Income tab

**Files:**
- Create/replace: `src/features/income/IncomeTab.jsx`

- [ ] **Step 1: Write `src/features/income/IncomeTab.jsx`**

```jsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { formatPeso } from '../../lib/format.js';

export default function IncomeTab({ event, income, onChange }) {
  const [form, setForm] = useState({ amount: '', income_date: '', source: '', description: '' });
  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function add(e) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount < 0 || !form.source.trim()) return;
    await supabase.from('income').insert({
      event_id: event.id,
      amount,
      income_date: form.income_date || new Date().toISOString().slice(0, 10),
      source: form.source.trim(),
      description: form.description,
    });
    setForm({ amount: '', income_date: '', source: '', description: '' });
    onChange();
  }

  return (
    <div>
      <form onSubmit={add}>
        <input type="number" min="0" step="0.01" placeholder="Amount ₱"
          value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
        <input type="date" value={form.income_date} onChange={(e) => set('income_date', e.target.value)} />
        <input placeholder="Source (e.g. Ticket Sales)" value={form.source}
          onChange={(e) => set('source', e.target.value)} required />
        <input placeholder="Description" value={form.description} onChange={(e) => set('description', e.target.value)} />
        <button>Add income</button>
      </form>
      <table border="1" cellPadding="6" style={{ marginTop: 12, width: '100%' }}>
        <thead><tr><th>Date</th><th>Source</th><th>Description</th><th>Amount</th></tr></thead>
        <tbody>
          {income.map((i) => (
            <tr key={i.id}>
              <td>{i.income_date}</td><td>{i.source}</td><td>{i.description}</td><td>{formatPeso(i.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Manually verify**

Add income "Ticket Sales" ₱1,000. Overview Total Income ₱1,000.00, Net Balance updates (income − approved spend).

- [ ] **Step 3: Commit**

```bash
git add src/features/income/IncomeTab.jsx
git commit -m "feat: income tab"
```

---

## Phase 8 — Receipts

### Task 8.1: Receipt upload helper

**Files:**
- Create: `src/features/receipts/uploadReceipt.js`

- [ ] **Step 1: Write `src/features/receipts/uploadReceipt.js`**

```js
import { supabase } from '../../lib/supabase.js';

const ALLOWED = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB, conservative for free tier

export async function uploadReceipt(file, { linkedType, linkedId, uploadedBy }) {
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Only JPG, PNG, or PDF receipts are allowed.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Receipt must be 5 MB or smaller.');
  }
  const path = `${linkedType}/${linkedId}/${Date.now()}-${file.name}`;
  const { error: upErr } = await supabase.storage.from('receipts').upload(path, file);
  if (upErr) throw upErr;

  const { data, error } = await supabase.from('receipts')
    .insert({ file_path: path, uploaded_by: uploadedBy, linked_type: linkedType, linked_id: linkedId })
    .select()
    .single();
  if (error) throw error;
  return data; // { id, file_path, ... }
}
```

- [ ] **Step 2: Attach receipts in the expense and income forms**

In `ExpensesTab.jsx` and `IncomeTab.jsx`, add a `<input type="file" accept="image/*,application/pdf" />`. After inserting the expense/income row, if a file is selected call `uploadReceipt(file, { linkedType, linkedId: newRow.id, uploadedBy: profile.id })`, then update the row's `receipt_id` with the returned receipt id. Wrap in `try/catch` and show the thrown message to the user. (Insert with `.select().single()` to get the new row id.)

- [ ] **Step 3: Manually verify**

Add an expense with a JPG receipt → succeeds. Try a `.txt` file → "Only JPG, PNG, or PDF receipts are allowed." Try a >5 MB file → size error.

- [ ] **Step 4: Commit**

```bash
git add src/features/receipts/uploadReceipt.js src/features/expenses/ExpensesTab.jsx src/features/income/IncomeTab.jsx
git commit -m "feat: receipt upload with type and size validation"
```

---

## Phase 9 — Reports

### Task 9.1: Report data model (TDD)

**Files:**
- Create: `src/features/reports/buildReportModel.js`
- Test: `tests/buildReportModel.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { buildReportModel } from '../src/features/reports/buildReportModel.js';

const event = { name: 'Fiesta 2026', event_date: '2026-08-15', location: 'Lucena City, Quezon' };
const org = { name: 'Church' };
const categories = [
  { id: 'c1', name: 'Food', planned_amount: 500 },
  { id: 'c2', name: 'Decor', planned_amount: 200 },
];
const expenses = [
  { amount: 300, category_id: 'c1', approval_status: 'approved' },
  { amount: 100, category_id: 'c1', approval_status: 'pending', description: 'Extra food' },
  { amount: 250, category_id: 'c2', approval_status: 'approved' },
];
const income = [{ amount: 1000, source: 'Ticket Sales' }];

describe('buildReportModel', () => {
  const model = buildReportModel({ org, event, categories, expenses, income });

  it('includes header fields', () => {
    expect(model.header).toMatchObject({
      organization: 'Church', eventName: 'Fiesta 2026',
      eventDate: '2026-08-15', location: 'Lucena City, Quezon',
    });
  });
  it('builds budget-vs-actual rows', () => {
    expect(model.budgetRows).toEqual([
      { id: 'c1', name: 'Food', planned: 500, spent: 300, difference: 200 },
      { id: 'c2', name: 'Decor', planned: 200, spent: 250, difference: -50 },
    ]);
  });
  it('builds income rows and total', () => {
    expect(model.incomeRows).toEqual([{ source: 'Ticket Sales', amount: 1000 }]);
  });
  it('computes bottom-line totals (approved spend only)', () => {
    expect(model.totals).toEqual({
      totalPlanned: 700, totalSpent: 550, totalIncome: 1000, netBalance: 450,
    });
  });
  it('lists pending expenses', () => {
    expect(model.pending).toEqual([{ amount: 100, description: 'Extra food' }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- buildReportModel`
Expected: FAIL — `buildReportModel is not a function`.

- [ ] **Step 3: Write minimal implementation**

```js
import { computeEventTotals, budgetVsActual } from '../events/eventTotals.js';

export function buildReportModel({ org, event, categories, expenses, income }) {
  return {
    header: {
      organization: org.name,
      eventName: event.name,
      eventDate: event.event_date,
      location: event.location,
      reportDate: new Date().toISOString().slice(0, 10),
    },
    budgetRows: budgetVsActual(categories, expenses),
    incomeRows: income.map((i) => ({ source: i.source, amount: i.amount })),
    totals: computeEventTotals({ categories, expenses, income }),
    pending: expenses
      .filter((e) => e.approval_status === 'pending')
      .map((e) => ({ amount: e.amount, description: e.description })),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- buildReportModel`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/reports/buildReportModel.js tests/buildReportModel.test.js
git commit -m "feat: report data model with tests"
```

### Task 9.2: PDF export

**Files:**
- Create: `src/features/reports/exportPdf.js`

- [ ] **Step 1: Write `src/features/reports/exportPdf.js`**

```js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPeso } from '../../lib/format.js';

export function exportPdf(model) {
  const doc = new jsPDF();
  const h = model.header;
  doc.setFontSize(14);
  doc.text(`${h.organization} — Event Budget Summary`, 14, 16);
  doc.setFontSize(10);
  doc.text(`Event: ${h.eventName}`, 14, 24);
  doc.text(`Date: ${h.eventDate || 'TBA'}    Location: ${h.location}`, 14, 30);
  doc.text(`Report generated: ${h.reportDate}`, 14, 36);

  autoTable(doc, {
    startY: 42,
    head: [['Category', 'Planned', 'Spent', 'Difference']],
    body: model.budgetRows.map((r) => [r.name, formatPeso(r.planned), formatPeso(r.spent), formatPeso(r.difference)]),
  });

  autoTable(doc, {
    head: [['Income Source', 'Amount']],
    body: model.incomeRows.map((r) => [r.source, formatPeso(r.amount)]),
  });

  const t = model.totals;
  autoTable(doc, {
    head: [['Total Planned', 'Total Spent', 'Total Income', 'Net Balance']],
    body: [[formatPeso(t.totalPlanned), formatPeso(t.totalSpent), formatPeso(t.totalIncome), formatPeso(t.netBalance)]],
  });

  if (model.pending.length) {
    autoTable(doc, {
      head: [['Pending Approval — Description', 'Amount']],
      body: model.pending.map((p) => [p.description || '(no description)', formatPeso(p.amount)]),
    });
  }

  const y = doc.lastAutoTable.finalY + 20;
  doc.text('Prepared by: ____________________', 14, y);
  doc.text('Approved by: ____________________', 14, y + 10);

  doc.save(`${h.eventName}-budget-summary.pdf`);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/reports/exportPdf.js
git commit -m "feat: pdf export of event budget summary"
```

### Task 9.3: Excel export

**Files:**
- Create: `src/features/reports/exportExcel.js`

- [ ] **Step 1: Write `src/features/reports/exportExcel.js`**

```js
import * as XLSX from 'xlsx';

export function exportExcel(model) {
  const wb = XLSX.utils.book_new();

  const budget = [['Category', 'Planned', 'Spent', 'Difference'],
    ...model.budgetRows.map((r) => [r.name, r.planned, r.spent, r.difference])];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(budget), 'Budget vs Actual');

  const income = [['Source', 'Amount'], ...model.incomeRows.map((r) => [r.source, r.amount])];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(income), 'Income');

  const t = model.totals;
  const summary = [['Total Planned', t.totalPlanned], ['Total Spent', t.totalSpent],
    ['Total Income', t.totalIncome], ['Net Balance', t.netBalance]];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');

  XLSX.writeFile(wb, `${model.header.eventName}-budget-summary.xlsx`);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/reports/exportExcel.js
git commit -m "feat: excel export of event budget summary"
```

### Task 9.4: Reports tab UI

**Files:**
- Create/replace: `src/features/reports/ReportsTab.jsx`

- [ ] **Step 1: Write `src/features/reports/ReportsTab.jsx`**

```jsx
import React from 'react';
import { buildReportModel } from './buildReportModel.js';
import { exportPdf } from './exportPdf.js';
import { exportExcel } from './exportExcel.js';

export default function ReportsTab({ event, data }) {
  const org = { name: event.__orgName || event.organization?.name || '' };

  function model() {
    return buildReportModel({
      org,
      event,
      categories: data.categories,
      expenses: data.expenses,
      income: data.income,
    });
  }

  return (
    <div>
      <p>Generate the Event Budget Summary:</p>
      <button onClick={() => exportPdf(model())}>Export PDF</button>
      <button onClick={() => exportExcel(model())}>Export Excel</button>
    </div>
  );
}
```

> **Note:** Pass the organization name into `EventDetail` (e.g., set `event.__orgName = org.name` where it is opened in `App.jsx`) so reports show the correct organization. Alternatively store the org object in app state and thread it through.

- [ ] **Step 2: Manually verify**

Open an event with budget, approved expenses, and income → Reports tab → Export PDF downloads a readable summary with peso amounts and signature lines → Export Excel downloads a 3-sheet workbook.

- [ ] **Step 3: Commit**

```bash
git add src/features/reports/ReportsTab.jsx src/App.jsx
git commit -m "feat: reports tab wiring pdf and excel export"
```

---

## Phase 10 — Settings (Admin user management)

### Task 10.1: Settings screen (admin only)

**Files:**
- Create: `src/features/settings/SettingsScreen.jsx`

- [ ] **Step 1: Write `src/features/settings/SettingsScreen.jsx`**

```jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';

export default function SettingsScreen({ profile }) {
  const [users, setUsers] = useState([]);
  const isAdmin = profile.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from('profiles').select('*').order('name').then(({ data }) => setUsers(data || []));
  }, [isAdmin]);

  async function setRole(id, role) {
    await supabase.from('profiles').update({ role }).eq('id', id);
    setUsers((u) => u.map((x) => (x.id === id ? { ...x, role } : x)));
  }

  if (!isAdmin) return <p>Only admins can manage users.</p>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Users</h2>
      <p style={{ color: '#666' }}>
        To add a new user: create them in Supabase Auth, then they appear here after their
        first profile row is created. Set their role below.
      </p>
      <table border="1" cellPadding="6">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td><td>{u.email}</td>
              <td>
                <select value={u.role} onChange={(e) => setRole(u.id, e.target.value)}>
                  <option value="admin">admin</option>
                  <option value="treasurer">treasurer</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Add a Settings entry point for admins in `App.jsx`**

Add a "Settings" button in the header, visible only when `profile.role === 'admin'`, that toggles rendering `<SettingsScreen profile={profile} />`.

- [ ] **Step 3: Manually verify**

As admin → Settings shows the users table and lets you change a role. Sign in as a treasurer (create one in Supabase) → no Settings button; RLS blocks profile writes even if attempted.

- [ ] **Step 4: Commit**

```bash
git add src/features/settings/SettingsScreen.jsx src/App.jsx
git commit -m "feat: admin settings screen for user roles"
```

---

## Phase 11 — Offline Banner & Polish

### Task 11.1: Offline banner

**Files:**
- Create: `src/components/OfflineBanner.jsx`

- [ ] **Step 1: Write `src/components/OfflineBanner.jsx`**

```jsx
import React, { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  if (online) return null;
  return (
    <div style={{ background: '#b00', color: 'white', padding: 8, textAlign: 'center' }}>
      You're offline — connect to save changes.
    </div>
  );
}
```

- [ ] **Step 2: Render `<OfflineBanner />` at the top of `App.jsx`**

- [ ] **Step 3: Manually verify**

Disable network → red banner appears; re-enable → it disappears.

- [ ] **Step 4: Commit**

```bash
git add src/components/OfflineBanner.jsx src/App.jsx
git commit -m "feat: offline banner"
```

---

## Phase 12 — Packaging

### Task 12.1: Build the Windows installer

**Files:**
- Create: `electron-builder.yml`

- [ ] **Step 1: Write `electron-builder.yml`**

```yaml
appId: com.lucena.eventbudgettracker
productName: Event Budget Tracker
directories:
  output: release
files:
  - dist/**/*
  - electron/**/*
win:
  target: nsis
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

- [ ] **Step 2: Build**

Run: `npm run package`
Expected: An installer `.exe` appears in `release/`.

- [ ] **Step 3: Manually verify**

Install from `release/`, launch the installed app, sign in, confirm data loads from Supabase.

- [ ] **Step 4: Commit**

```bash
git add electron-builder.yml package.json
git commit -m "build: windows installer via electron-builder"
```

---

## Phase 13 — Release Checklist

### Task 13.1: Run the full test suite and manual checklist

- [ ] **Step 1: Run all unit tests**

Run: `npm test`
Expected: All suites pass (format, money, eventTotals, buildReportModel).

- [ ] **Step 2: Manual release checklist** (run before each release)

```
[ ] Sign in as admin; wrong password shows friendly error.
[ ] Pick Church; create event; pick School; events stay separate.
[ ] Add 2 budget categories; Overview Total Planned correct.
[ ] Add expense (pending) → not counted; Approve → counted; Reject → never counted.
[ ] Add income → Total Income and Net Balance correct.
[ ] Attach JPG receipt (ok); .txt rejected; >5MB rejected.
[ ] Reports → Export PDF (readable, signature lines); Export Excel (3 sheets).
[ ] As treasurer: no Settings button; cannot manage users.
[ ] Disable network → offline banner; re-enable → gone.
```

- [ ] **Step 3: Commit any fixes found, then tag a release**

```bash
git add -A
git commit -m "chore: release checklist pass"
git tag v1.0.0
```

---

## Self-Review Notes

- **Spec coverage:** planned budget (Phase 5), expenses + approval (Phase 6), income no-approval (Phase 7), receipts with type/size limits (Phase 8), reports PDF+Excel with signature lines and pending list (Phase 9), two roles + admin-only user management (Phase 10), RLS permissions (Phase 2), offline handling (Phase 11), peso formatting throughout, church/school separation (Phase 4), testing of money math (Phases 1 & 9). All spec sections map to tasks.
- **Type consistency:** `computeEventTotals` returns `{ totalPlanned, totalSpent, totalIncome, netBalance }` used identically in EventsList, EventDetail, and buildReportModel. `budgetVsActual` rows `{ id, name, planned, spent, difference }` reused in reports.
- **Known follow-ups:** New-user onboarding requires a manual Supabase Auth step (acceptable for the 2-user scale per spec) — a future enhancement could add an invite flow.
