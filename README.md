# Meeting Room Booking

Internal dashboard for booking the meeting room. Built with Next.js (App Router,
JavaScript) and Upstash Redis. No landing page — logging in takes you straight
to the dashboard.

- 1 meeting room, bookable by the hour (any start/end time you like, as long as
  it doesn't overlap another booking)
- Operating hours: 06:00–20:00, every day
- 4 unit accounts (Knowledge and Innovation, Strategy and Growth, Risk and
  Quality, Lembaga Sertifikasi Profesi) + 1 Admin account for you
- No approval step — booking is instant
- Every unit can cancel its own bookings; Admin can view, cancel, and book on
  behalf of any unit
- Bilingual: Indonesian / English, toggle top-right
- Font: Onest, everywhere

---

## 1. Requirements

- Node.js 18.18 or newer ([nodejs.org](https://nodejs.org))
- A free [Upstash](https://upstash.com) account (for Redis)

---

## 2. Set up Upstash Redis (the database)

1. Go to <https://upstash.com>, sign up / log in.
2. Click **Create Database**. Pick any name and the region closest to your
   users (e.g. Singapore for Indonesia). Type: **Regional** is fine.
3. Once created, open the database and scroll to **REST API**.
4. Copy the two values shown there:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   You'll paste these into `.env.local` in the next step.

---

## 3. Project setup (on your computer)

1. Unzip the project. You should have a folder called `meeting-room-booking`.
2. Open a terminal inside that folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Create your environment file by copying the example:

   ```bash
   cp .env.local.example .env.local
   ```

5. Open `.env.local` in any text editor and fill in:

   | Variable | What to put |
   |---|---|
   | `UPSTASH_REDIS_REST_URL` | from Upstash step 4 above |
   | `UPSTASH_REDIS_REST_TOKEN` | from Upstash step 4 above |
   | `SESSION_SECRET` | any random string, 32+ characters (generate one at <https://generate-secret.vercel.app/32>) |
   | `ADMIN_USERNAME` / `ADMIN_PASSWORD` | your own login (Admin) |
   | `UNIT_KI_USERNAME` / `UNIT_KI_PASSWORD` | login for Knowledge and Innovation |
   | `UNIT_SG_USERNAME` / `UNIT_SG_PASSWORD` | login for Strategy and Growth |
   | `UNIT_RQ_USERNAME` / `UNIT_RQ_PASSWORD` | login for Risk and Quality |
   | `UNIT_LSP_USERNAME` / `UNIT_LSP_PASSWORD` | login for Lembaga Sertifikasi Profesi |

   There is no sign-up page — these 5 accounts (4 units + admin) are the only
   accounts, and they only exist in this env file.

6. Run it locally:

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000> — you'll land on the login page.

---

## 4. Deploying (e.g. to Vercel)

1. Push this project to a GitHub repo, then import it in
   [Vercel](https://vercel.com/new).
2. In the Vercel project's **Settings → Environment Variables**, add every
   variable from your `.env.local` (same names, same values — or new
   passwords for production).
3. Deploy. That's it — Upstash Redis is already a cloud database, so no
   extra database setup is needed on the hosting side.

---

## 5. How the booking rule works

- Every unit picks its own start and end time (in 15-minute steps) between
  06:00 and 20:00.
- The server always re-checks for overlaps at the moment of booking, so two
  units can never end up double-booked even if they click at the same time.
- There's no daily/weekly limit — a unit can book as many days ahead as it
  wants.

## 6. What the Admin account can do differently

- Sees **all** units' bookings (color-coded) on the Dashboard grid, not just
  its own.
- On the Room Booking page and the click-to-book modal, Admin gets an extra
  "Book on behalf of" dropdown to create a booking for any unit.
- The "My Orders" menu becomes **All Orders** for Admin, listing every unit's
  bookings, and Admin can cancel any of them.

## 7. Changing things later

- **Room name / hours**: edit `ROOM_OPEN_MINUTES` / `ROOM_CLOSE_MINUTES` in
  `lib/time.js`.
- **Unit names / colors**: edit `lib/units.js`.
- **Text (English/Indonesian)**: edit `lib/dictionary.js`.
- **Passwords**: just change them in `.env.local` (or your host's environment
  variables) — no code change or redeploy of the database needed.

---

## Project structure

```
meeting-room-booking/
├── app/
│   ├── layout.js              # root layout, loads Onest font
│   ├── globals.css            # design tokens + all styling
│   ├── page.js                # redirects to /login or /dashboard
│   ├── login/page.js
│   ├── (app)/                 # everything behind login
│   │   ├── layout.js           # sidebar + top bar shell
│   │   ├── dashboard/page.js
│   │   ├── booking/page.js
│   │   └── my-orders/page.js
│   └── api/
│       ├── auth/login/route.js
│       ├── auth/logout/route.js
│       └── bookings/route.js, bookings/[id]/route.js
├── components/                # UI, split by feature
├── lib/                        # auth, session, redis, booking logic, i18n
├── middleware.js               # route protection
└── .env.local.example
```
