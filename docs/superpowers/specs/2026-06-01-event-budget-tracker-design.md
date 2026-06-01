# Event Budget Tracker — Design Document

**Date:** 2026-06-01
**Author:** Allan Chester Lagrason
**Status:** Approved design, pending implementation plan

---

## 1. Overview

A Windows desktop application for tracking **event budgets** for a **church** and a
**school** located in Lucena City, Quezon Province, Philippines. Multiple people
(an Admin and a Treasurer/Approver) share the same data from different computers,
mostly on-site but occasionally remote, so data is stored in the cloud.

All money is in **Philippine Peso (₱)**.

### Goals
- Track planned budgets, actual expenses, and income per event.
- Require approval for expenses before they count as final.
- Attach receipts (images/PDF) to expenses and income.
- Produce printable/exportable summary reports for leadership.
- Keep church and school data fully separated.
- Stay entirely on free cloud tiers.

### Non-Goals (YAGNI)
- No payroll, accounting ledgers, or tax features.
- No mobile app (desktop only).
- No more than the two roles defined below.
- No multi-currency support (Peso only).

---

## 2. Technology

| Layer | Choice | Reason |
|-------|--------|--------|
| Desktop shell | **Electron** | Real Windows `.exe`, huge ecosystem, easy reports/PDF. |
| UI | **React** | Component-based, fast to build. |
| Backend | **Supabase (free tier)** | Bundles Postgres DB + Auth + file Storage in one free service. |
| Auth | Supabase Auth | Email/password login, role support. |
| File storage | Supabase Storage | Holds receipt images/PDFs. |
| Reports | PDF + Excel (.xlsx) export | Printable for leadership; Excel for further math. |

---

## 3. Architecture

```
┌─────────────────────────────┐         ┌──────────────────────────┐
│   Desktop App (Electron)    │         │   Supabase (free cloud)  │
│   - React UI                │  HTTPS  │   - Postgres database    │
│   - Login screen            │◄───────►│   - Auth (login/roles)   │
│   - Church / School views   │         │   - Storage (receipts)   │
│   - Reports (PDF/Excel)     │         │                          │
└─────────────────────────────┘         └──────────────────────────┘
```

The app is a single installable `.exe`. All shared data and receipt files live in
Supabase so every user sees the same numbers.

---

## 4. Data Model

### organizations
Two fixed rows: `Church`, `School`.
- `id`, `name`

### users
- `id`, `name`, `email`, `role` (`admin` | `treasurer`)
- Authentication handled by Supabase Auth; this table holds profile + role.

### events
- `id`, `organization_id` (FK), `name`, `event_date`, `location`,
  `status` (`planning` | `active` | `closed`), `overall_budget` (optional ₱), `created_by`

### budget_categories
- `id`, `event_id` (FK), `name`, `planned_amount` (₱)

### expenses
- `id`, `event_id` (FK), `category_id` (FK), `amount` (₱), `expense_date`,
  `description`, `paid_by`, `approval_status` (`pending` | `approved` | `rejected`),
  `approved_by`, `receipt_id` (optional FK)

### income
- `id`, `event_id` (FK), `amount` (₱), `income_date`, `source`, `description`,
  `receipt_id` (optional FK)
- **Income is recorded freely — no approval step.** (Only expenses require approval.)

### receipts
- `id`, `file_path` (Supabase Storage), `uploaded_by`, `linked_type`
  (`expense` | `income`), `linked_id`
- Accepts images and PDF only, with a size limit to stay within the free storage tier.

### Computed per event
- **Total Planned** = sum of `budget_categories.planned_amount`
- **Total Spent** = sum of `expenses.amount` where `approval_status = approved`
- **Total Income** = sum of `income.amount`
- **Net Balance** = Total Income − Total Spent

---

## 5. Screens & User Flow

1. **Login** — email + password (Supabase Auth).
2. **Organization picker** — choose **Church** or **School**.
3. **Events list** — events for the chosen org with status and quick totals
   (₱ Planned / Spent / Income / Balance). Button: **+ New Event**.
4. **Event detail** — tabbed workspace:
   - **Overview** — the 4 totals + a budget-vs-spent bar.
   - **Budget** — categories with planned amounts (add/edit/delete).
   - **Expenses** — table; add new (amount, date, description, paid-by, category,
     attach receipt). Approve/Reject pending expenses.
   - **Income** — table; add new (amount, date, source, attach receipt).
   - **Reports** — generate/print/export (Section 6).
5. **Settings** (Admin only) — manage users and roles.

### Roles
| Capability | Admin | Treasurer/Approver |
|------------|:-----:|:------------------:|
| Create/edit events | ✅ | ✅ |
| Add/edit budget, expenses, income | ✅ | ✅ |
| Approve/reject expenses | ✅ | ✅ |
| View/export reports | ✅ | ✅ |
| Manage users & roles | ✅ | ❌ |
| Delete events | ✅ | ❌ |

---

## 6. Reports & Exports

**Event Budget Summary** report contains:
- Header: organization, event name, date, location (Lucena City, Quezon), report date.
- **Budget vs Actual** table: per category — Planned ₱, Spent ₱, Difference ₱.
- **Income** table: each source with amounts + total income.
- **Bottom line:** Total Planned, Total Spent (approved only), Total Income, Net Balance.
- Optional list of expenses **pending approval**.
- Signature lines (Prepared by / Approved by) for printing.

**Export formats:** PDF (printable) and Excel (.xlsx).
All amounts formatted as Philippine Peso (₱1,234.56).

---

## 7. Error Handling

- **Offline:** clear "You're offline — connect to save changes" banner; loaded data
  stays viewable; no crash.
- **Login errors:** friendly messages ("Wrong password", "No account found").
- **Permissions:** enforced at the database via Supabase Row Level Security (RLS), so
  a Treasurer cannot manage users even if the UI is bypassed.
- **Money validation:** no negatives, no letters; approved expenses locked from casual edits.
- **Receipts:** images and PDF only, with a size limit.

---

## 8. Testing

- **Unit tests:** money math (totals, balances, budget-vs-actual) — the core of the app.
- **Integration tests:** create event → add expense → approve → totals update correctly.
- **Manual test checklist:** run before each release (login, create event,
  add/approve expense, export PDF).

---

## 9. Open Items / Future Considerations
- Decide exact Supabase free-tier storage limit for receipt sizing.
- Optional future: income approval, multiple organizations, mobile access.
