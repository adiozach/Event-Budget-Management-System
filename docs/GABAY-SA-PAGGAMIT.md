# Event Budget Tracker — Gabay sa Paggamit

Isang simpleng gabay kung paano gamitin ang **Event Budget Tracker** para sa Church at School (Lucena City).

---

## 1. Pag-login
1. Buksan ang **Event Budget Tracker** (i-double click ang app icon).
2. Ilagay ang iyong **email** at **password** na binigay ng admin.
3. I-click ang **Sign in**.

> Kung mali ang email/password, may lalabas na "Wrong email or password." Subukang muli o tanungin ang admin.

---

## 2. Pagpili ng Organisasyon
Sa kaliwang bahagi (sidebar), pumili:
- **Church** — para sa mga event ng simbahan
- **School** — para sa mga event ng paaralan

Magkahiwalay ang datos ng dalawa.

---

## 3. Paggawa ng Event
1. Piliin ang **Church** o **School**.
2. Sa kahon na **"New event name"**, i-type ang pangalan (hal. *Fiesta 2026*).
3. I-click ang **+ New Event**.
4. Lalabas ito sa listahan. I-click ang **Open** para makita ang detalye.

---

## 4. Mga Tab sa Loob ng Event

### 📊 Overview
Makikita ang 4 na numero:
- **Total Planned** — kabuuang nakaplanong budget
- **Total Spent** — nagastos na (mga **approved** na expense lang)
- **Total Income** — kabuuang pumasok na pera
- **Net Balance** — Income kulang sa Spent

### 📈 Analytics
Mga graph: budget vs actual, breakdown ng gastos, income by source, at gastos sa paglipas ng panahon.

### 💰 Budget
1. I-type ang **category** (hal. *Pagkain*) at **planned amount** (₱).
2. I-click ang **Add category**.
Pwede ring i-**Delete** ang mali.

### 🧾 Expenses (Gastos)
1. Ilagay ang **Amount (₱)**, petsa, deskripsyon, sino ang nagbayad, at category.
2. Pwedeng mag-attach ng **resibo** (litrato o PDF) — i-click ang file button.
3. I-click ang **Add expense**.
4. Ang bagong gastos ay **Pending** muna. I-click ang **Approve** para mabilang ito sa Total Spent, o **Reject** kung mali.

> **Approved** lang ang nabibilang sa "Total Spent." Ang pending ay hindi pa.

### 💵 Income (Kita)
1. Ilagay ang **Amount (₱)**, petsa, **source** (hal. *Ticket Sales*, *Donation*), at deskripsyon.
2. Pwedeng mag-attach ng resibo.
3. I-click ang **Add income**.

### 📄 Reports
- **Export PDF** — para i-print o i-file (may pirmahan na "Prepared by / Approved by").
- **Export Excel** — para sa karagdagang kompyut.

---

## 5. Settings (Admin lang)
Kung ikaw ay **Admin**, may **⚙️ Settings** sa sidebar:
- Makikita ang lahat ng users at ang kanilang **role**.
- Pwedeng baguhin ang role: **admin** o **treasurer**.

### Paano magdagdag ng bagong user (Admin task)
1. Pumunta sa Supabase → **Authentication → Users → Add user** (buksan ang *Auto Confirm*).
2. Pagkatapos, lalabas sila sa **Settings** ng app — itakda ang kanilang role doon.

---

## 6. Mga Role
- **Admin** — lahat ng kontrol, kasama ang pamamahala ng users at pagbura ng event.
- **Treasurer** — gumagawa ng event, naglalagay ng budget/expenses/income, nag-a-approve ng expense, tumitingin ng reports. Hindi pwedeng mag-manage ng users.

---

## 7. Kapag Walang Internet
Kung mawalan ng internet, may **pulang banner** sa itaas: *"You're offline — connect to save changes."* Kumonekta muli bago mag-save.

---

## 8. Mga Tip
- **Regular na mag-Export ng PDF/Excel** bilang backup.
- Gamitin ang ₱ amounts nang tama (walang negatibo o letra).
- Mag-**Log out** kapag tapos na, lalo na sa shared computer.

---

*Para sa teknikal na tanong o problema, kontakin ang developer.*
