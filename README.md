<div align="center">
  <img src="src/assets/logo.png" alt="EBMS Logo" width="90" />

  # Event Budget Management System (EBMS)

  A modern Windows desktop application for managing event budgets — built for churches, schools, and organizations.

  <sub>Electron · React · Vite · Supabase · recharts</sub>
</div>

---

## 📖 Overview

**EBMS** helps an organization plan and track the finances of its events — budgets, expenses (with an approval workflow), income, and receipts — across multiple users, with a full audit trail and printable reports. It was built and delivered for **Grace Baptist Church (GBC)** and **BVBC** in Lucena City, Quezon.

Data lives in the cloud (Supabase) so multiple people on different computers always see the same numbers, while the app installs and runs as a normal Windows `.exe`.

---

## ✨ Features

- **Two organizations** switchable in the sidebar (e.g. GBC / BVBC)
- **Org dashboard** — at-a-glance totals across all events + pending-approval count
- **Pending-approvals bell** 🔔 showing which org & event needs review (click to jump there)
- **Events** — create (modal), edit details, change status (planning / active / closed), search, delete (admin)
- **Budget categories** with planned amounts
- **Expenses** with an **approval workflow** — only *approved* expenses count as spent; **approved records are locked** (admin can revert)
- **Income** tracking
- **Receipts** — attach JPG/PNG/PDF, view via secure links
- **Analytics** — budget vs actual, expense breakdown, income by source, cumulative spending (recharts)
- **Reports** — per-event and **organization-wide** summaries, exportable to **PDF & Excel**
- **Audit trail** — append-only log of who did what, when
- **Backup & Restore** — download/restore all data as a file
- **Roles** — Admin & Treasurer (enforced by database Row-Level Security)
- Modern dark UI with toasts, skeleton loaders, offline detection, and an error boundary

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop shell | Electron |
| UI | React + Vite |
| Backend | Supabase (Postgres + Auth + Storage) with Row-Level Security |
| Charts | recharts |
| Reports | jsPDF + jspdf-autotable, xlsx |
| Tests | Vitest |
| Packaging | electron-builder (NSIS installer) |

---

## 🏗️ Architecture

```
┌─────────────────────────────┐        ┌──────────────────────────┐
│   Desktop App (Electron)    │ HTTPS  │   Supabase (cloud)       │
│   React UI                  │◄──────►│   Postgres + Auth        │
│   Login · Dashboard · Events│        │   Storage (receipts)     │
│   Analytics · Reports       │        │   Row-Level Security     │
└─────────────────────────────┘        └──────────────────────────┘
```

The app uses only the public **anon key** (safe — RLS protects all data). The `service_role` key is never bundled.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) project

### 1. Clone & install
```bash
git clone https://github.com/adiozach/Event-Budget-Management-System.git
cd Event-Budget-Management-System
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in your Supabase **Project URL** and **anon key**:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set up the database
In the Supabase **SQL Editor**, run the migrations in order:
```
supabase/migrations/001_schema.sql
supabase/migrations/002_rls.sql
supabase/migrations/003_storage_and_hardening.sql
supabase/migrations/004_rename_orgs.sql
supabase/migrations/005_auto_profile.sql
supabase/migrations/006_audit_and_lock.sql
```
Then create a **private Storage bucket** named `receipts`, and create your first admin (see the migration comments).

### 4. Run in development
```bash
npm run dev
```

### 5. Build the Windows installer
```bash
npm run package
```
The installer appears in `release/`. *(Requires Windows Developer Mode for the signing step.)*

---

## 🧪 Testing

All financial formulas are covered by unit tests:
```bash
npm test
```

---

## 📁 Project Structure

```
src/
  lib/        supabase, money (tested), format, audit, backup
  features/
    auth/       login + session
    events/     dashboard, event detail, totals (tested)
    budget/ expenses/ income/   per-event data
    receipts/   upload + view
    analytics/  charts + model (tested)
    reports/    per-event & org-wide PDF/Excel (tested)
    dashboard/  org summary (tested)
    settings/   users, audit log, backup/restore
  components/   Icon, toast, Skeleton, OfflineBanner, ErrorBoundary
electron/       main + preload
supabase/migrations/   database schema, RLS, triggers
```

---

## 🔐 Security

- **Row-Level Security** on every table; roles enforced at the database, not just the UI
- **Approved expenses are locked** from edits except by admins
- **Append-only audit log** (cannot be altered via the app)
- Only the public anon key ships with the app

---

## 👤 Author

**Allan Chester Lagrason** — Lucena City, Quezon
📧 allanchesterlagrason36@gmail.com

---

## 📄 License

© 2026 Allan Chester Lagrason. All rights reserved.
This software is proprietary. Clients receive a license to use the application; the source code and the right to reuse/resell remain with the author.
