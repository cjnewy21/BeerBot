# Bartender Bot

A minimal drink-ordering site for a bartending robot. Customers
scan a QR code at their bar station and get a locked-down menu
page that inserts orders directly into a Supabase Postgres
database.

**Architecture:**

```
Browser ──HTTPS──> Render Static Site  (HTML / CSS / JS only)
       │
       └──HTTPS──> Supabase  (Postgres + auto REST API)
                       ▲
                       │
   (next phase)  ctrlX + Node-RED  ──HTTPS──> Supabase
                                              polls for pending orders
```

No backend code of yours. The browser uses the Supabase JS
client to insert orders. Supabase's Row Level Security makes
this safe even though the API key is public.

---

## What's in here

```
bartender-bot/
├── index.html              Admin page. Lists stations + QR codes.
├── order.html              The page each QR points at. No nav.
├── assets/
│   ├── config.js           THE FILE YOU EDIT (Supabase keys, stations, drinks)
│   ├── style.css
│   ├── app.js              Order page logic
│   ├── admin.js            Admin page logic + QR code generator
│   └── logo.svg            Mechatronic Solutions logo
├── db/
│   └── schema.sql          Paste this into Supabase's SQL Editor (once)
├── .gitignore
└── README.md               (this file)
```

---

## URL model

| URL                                       | Who                  | Has navigation? |
| ----------------------------------------- | -------------------- | --------------- |
| `/`                                       | You (admin)          | Yes — lists all stations |
| `/order.html?station=1`                   | You (testing)        | No |
| `/order.html?station=1&kiosk=1`           | Customer via QR scan | No |

The order page never links anywhere, so a customer who scans
the QR for station 1 can't navigate to station 2. The admin
page is only reachable by typing its URL — don't share it.

---

## Setup — the full order of operations

### 1. Set up Supabase

1. Go to https://supabase.com → sign in with GitHub → **New Project**.
2. Name it (e.g. `bartender-bot`). Set a database password
   (save it somewhere — you don't need it day-to-day but you'll
   want it if you ever connect a GUI client). Pick a region
   near you. Wait ~2 minutes for it to provision.
3. In the left sidebar, click **SQL Editor** → **+ New query**.
4. Open `db/schema.sql` from this project, copy the entire
   file, paste it into the editor, click **Run**.
5. In the left sidebar, click **Settings** (gear icon) →
   **API**. You'll need two things:
   - **Project URL** — something like
     `https://abcdefgh.supabase.co`
   - **Project API Keys** → **anon** **public** — a long
     string starting with `eyJhbGc...`
6. Open `assets/config.js` in this project and paste both
   values into `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

> **Is it really safe to put the anon key in a public GitHub
> repo?** Yes. The anon key only does what your Row Level
> Security policies allow, and `db/schema.sql` only grants
> `INSERT` on the `orders` table. Anyone with the key can
> place orders; they cannot read existing ones or touch
> anything else. The keys you must NOT publish are the
> `service_role` key (used by Node-RED later) and the database
> password.

### 2. Test it locally before going to Render

You need any local HTTP server. The simplest is Python (comes
with Windows now, or use any Python install you have):

```bash
cd /path/to/bartender-bot
python -m http.server 8000
```

Open http://localhost:8000 — admin page with QR codes.
Open http://localhost:8000/order.html?station=1 — order page.

Tap a drink. You should see "Order received #N". Now check
Supabase: dashboard → **Table Editor** → **orders**. Your row
is there. ✅

(If the order fails, open the browser's dev tools console with
F12 and look at the error. Most likely culprit: typo in the
Supabase URL or key in `config.js`.)

### 3. Push to GitHub

If git isn't installed yet, grab it from
https://git-scm.com/download/win (installs Git Bash too — open
that for the following commands). One-time identity setup:

```bash
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
```

Create an empty repo on github.com: click `+` (top right) →
**New repository** → name `bartender-bot` → leave Public →
**DO NOT** add a README, .gitignore, or license (your local
folder already has them).

Then in Git Bash, inside the project folder:

```bash
git init -b main
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/bartender-bot.git
git push -u origin main
```

Future changes: `git add .` → `git commit -m "..."` →
`git push`. Render redeploys automatically on every push.

### 4. Deploy to Render

1. https://render.com → sign in with GitHub.
2. **New +** → **Static Site**.
3. Pick the `bartender-bot` repo.
4. Settings:
   - **Name**: anything (becomes part of your URL).
   - **Branch**: `main`
   - **Build Command**: *(leave blank)*
   - **Publish directory**: `.` (a single dot — the repo root)
5. Click **Create Static Site**.

Render assigns you a URL like
`https://bartender-bot-xxxx.onrender.com`. Open `/` to see
the admin page — the QR codes now encode the real Render URL
and are ready to print.

Render Static Sites are completely free, never spin down, and
auto-deploy on every push to `main`.

---

## Adding more stations

1. In `assets/config.js`, uncomment or add entries to
   `STATIONS`.
2. In Supabase SQL Editor, run:
   ```sql
   insert into stations (id, name, description) values
     (2, 'Station 2', 'Patio'),
     (3, 'Station 3', 'Lounge')
   on conflict (id) do nothing;
   ```
3. Commit and push:
   ```bash
   git add .
   git commit -m "Add stations 2 and 3"
   git push
   ```

The admin page automatically renders a QR code for every entry
in `STATIONS`.

---

## Adding more drinks

Same pattern: add to the `DRINKS` array in `assets/config.js`,
insert a matching row into the `drinks` table in Supabase,
push.

---

## What's next: the robot side

When the website is verifying orders into Supabase reliably,
the next step is the Node-RED flow on the ctrlX:

1. Periodically `GET https://YOUR-PROJECT.supabase.co/rest/v1/orders?status=eq.pending`
   to fetch new orders.
2. For each order, drive the robot to pour the drink at the
   right station.
3. `PATCH .../orders?id=eq.N` with `{"status":"completed"}`
   when done.

That flow will use the **service role key** (not the anon key),
which lives only on the ctrlX and bypasses RLS so it can read
and update everything. We'll scaffold that flow next.
