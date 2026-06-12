# Event Budget Management System — Handover Note

**Para sa:** Grace Baptist Church
**Petsa ng turnover:** _______________
**Inihanda ni:** Allan Chester Lagrason

---

## 1. Ano ang Event Budget Management System?

Isang **desktop application** (para sa Windows) na ginawa para i-track ang budget ng
mga event ng **Church** at **School** sa Lucena City. Kaya nitong:

- Mag-set ng **planong budget** kada kategorya (hal. Pagkain, Dekorasyon)
- Mag-record ng **gastos (expenses)** na dadaan sa **approval**
- Mag-record ng **kita (income/donations)**
- Mag-attach ng **resibo** (litrato o PDF)
- Mag-generate ng **report** (PDF at Excel) na pwedeng i-print
- May **graphs/analytics** kada event

Ang datos ay naka-imbak sa cloud (Supabase), kaya **pareho ang nakikita** ng lahat ng
gumagamit kahit magkaibang computer.

---

## 2. Paano i-install (one-time)

1. Kunin ang file na **`Event Budget Management System Setup 1.0.0.exe`** (galing sa USB / Google Drive).
2. I-double click ito.
3. ⚠️ Kung may lumabas na asul na **"Windows protected your PC"**:
   - I-click ang **"More info"** → tapos **"Run anyway"**.
   - *(Normal lang ito — dahil libre/internal ang app, hindi ito bayad na "code-signed." Ligtas ito.)*
4. Piliin kung saan i-install → **Install** → **Finish**.
5. Lalabas ang app sa **Start Menu** at **Desktop** (may pulang logo).

---

## 3. Unang Login

- Bigyan ka ng **email** at **password** ng admin/developer.
- Buksan ang app → ilagay ang email at password → **Sign in**.

> Kung "Wrong email or password," i-double check ang spelling at malaki/maliit na letra,
> o tanungin ang admin.

📘 **May detalyadong gabay sa paggamit:** tingnan ang `GABAY-SA-PAGGAMIT.md`.

---

## 4. Mga Role (Pwede sa users)

| Role | Kaya gawin |
|------|-----------|
| **Admin** | Lahat — pag-manage ng users, pagbura ng event, lahat ng datos |
| **Treasurer** | Gumawa ng event, mag-input ng budget/expenses/income, mag-approve ng expense, mag-export ng report. **Hindi** kayang mag-manage ng users. |

---

## 5. MGA MAHALAGANG PAALALA ⚠️

1. **Kailangan ng internet** para gumana ang app (cloud-based ang datos).
   Kapag offline, may pulang banner — kumonekta muna bago mag-save.

2. **Free plan ang cloud database (Supabase):**
   - **Nagpa-pause ito kapag 7 araw na walang aktibidad.** Kung mangyari ito, kailangang
     buksan muli ng admin ang Supabase dashboard para mag-resume.
   - Para iwas-abala (laging bukas + may automatic backup), pwedeng mag-upgrade sa
     bayad na plan (~$25/buwan). I-usap ito kung kailangan.

3. **Backup:** Ugaliing mag-**Export ng PDF/Excel** ng mga report bilang kopya/backup.

4. **Pag-aari ng datos:** Mainam na ang Supabase account ay nasa pangalan/email ng
   organisasyon para kayo ang may kontrol sa inyong datos sa hinaharap.

---

## 6. Pagdagdag ng Bagong User (Admin task)

1. Pumunta sa **Supabase → Authentication → Users → Add user**
   (buksan ang **"Auto Confirm User"**).
2. Ibigay ang email at pansamantalang password.
3. Sa app, pumunta sa **Settings** → itakda ang role (admin o treasurer).

---

## 7. Suporta

Para sa teknikal na problema, kontakin ang developer:

- **Pangalan:** Allan Chester Lagrason
- **Email:** allanchesterlagrason36@gmail.com
- **Cellphone/Viber:** _______________

---

*Salamat sa pagtitiwala. — Event Budget Management System, v1.0.0*
