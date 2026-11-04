# LuxuryStay Hospitality — Hotel Management System (MERN)

A complete Hotel Management System for **LuxuryStay Hospitality**, built with **MongoDB, Express, React and Node.js**.
Five roles (Admin, Manager, Receptionist, Housekeeping, Guest) share one login and each get their own workspace.
All photos (rooms, profile photos, maintenance photos, homepage photo) are uploaded to **Cloudinary** and their URLs are stored in MongoDB.
The interface uses **Poppins**, a warm **Off-White `#F7F3ED` / Warm Beige `#B69A7D` / Luxury Brown `#6B4F3A`** palette (about 60 / 25 / 15), **light and dark modes** (toggle in the header), animations, and works on phones, tablets and desktops.
All colours live in `frontend/src/styles/tokens.css`, so the whole theme can be changed from one file.

```
LuxuryStay-HMS/
├── backend/      Express + MongoDB REST API      (runs on http://localhost:5000)
├── frontend/     React + Vite web app            (runs on http://localhost:5173)
├── postman/      Postman collection for every API endpoint
└── docs/         API reference and user guide
```

---

## 1. What you need to install

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18.18 or newer (LTS recommended) | https://nodejs.org |
| MongoDB Community Server | 6 or newer | https://www.mongodb.com/try/download/community |
| MongoDB Compass (optional, to see the data) | latest | installed together with MongoDB, or https://www.mongodb.com/try/download/compass |
| Postman (optional, to test the API) | latest | https://www.postman.com/downloads |
| VS Code (recommended editor) | latest | https://code.visualstudio.com |

Check Node is installed: open a terminal and run `node -v` and `npm -v`.

> **No local MongoDB?** Use MongoDB Atlas (free): create a cluster → *Database Access* (add a user) →
> *Network Access* (allow your IP) → *Connect → Drivers* and copy the `mongodb+srv://...` link into `MONGO_URI`.

### Cloudinary (image uploads)
1. Create a free account at https://cloudinary.com.
2. Open **Dashboard → API Keys** (or *Settings → API Keys*) and copy **Cloud name**, **API key** and **API secret**.
3. Paste them into `backend/.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Restart the backend. You should see `✔ Cloudinary connected → your_cloud_name`.
5. Run `npm run seed` again: the demo room photos and homepage photo are copied into your Cloudinary account
   (folder `luxurystay/`) and their Cloudinary URLs are saved in MongoDB.

Without these keys the app still runs, but uploading new photos shows a message asking you to add them.

### Email (SMTP)
The hotel sends real emails for: welcome after sign-up, staff/guest invitations (set your password), forgot password,
password changed, booking confirmed, booking cancelled, check-in welcome, invoice at check-out, payment received and
replies to feedback. Any SMTP provider works.

**Gmail (easiest for testing)**
1. Turn on 2-Step Verification on the Google account.
2. Google Account → Security → **App passwords** → create one for "Mail" (16 characters).
3. In `backend/.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=yourname@gmail.com
   SMTP_PASS=the16characterapppassword
   EMAIL_FROM="LuxuryStay Hospitality" <yourname@gmail.com>
   ```
4. Restart the backend — you should see `✔ Email (SMTP) connected → smtp.gmail.com`.

For a real hotel use a transactional provider (Brevo, Mailgun, SendGrid, Amazon SES) with your own domain.
Without SMTP keys nothing breaks: each email is written to the backend terminal instead, including reset links, so you can still test.

**Forgot password flow:** login page → *Forgot password?* → email with a one-time link (valid 30 minutes) →
`/reset-password/<token>` → new password. Only a SHA-256 hash of the token is stored, the link works once,
and changing the password signs the user out on all other devices.

---

## 2. Run the project (two terminals)

### Terminal 1 — backend
```bash
cd backend
npm install          # first time only
npm run seed         # first time only: loads demo rooms, users, bookings
npm run dev          # starts the API and restarts on file changes
```
You should see:
```
  LuxuryStay HMS — API Server
✔ MongoDB connected → 127.0.0.1/luxurystay_hms
✔ Cloudinary connected → your_cloud_name
✔ Email (SMTP) connected → smtp.gmail.com
✔ Server running in development mode
✔ API base URL  → http://localhost:5000/api
ℹ Health check  → http://localhost:5000/api/health
```

### Terminal 2 — frontend
```bash
cd frontend
npm install          # first time only
npm run dev
```
You should see:
```
  VITE ready ...  ➜  Local: http://localhost:5173/
  ✔ LuxuryStay frontend is running
  ✔ Connected to backend API (http://localhost:5000/api) — database connected
```
Open **http://localhost:5173** in the browser.

### Seeded accounts

`npm run seed` creates these accounts. **All use the password set in `SEED_PASSWORD`** in `backend/.env`
(default **`LuxuryStay@2026`**). There are no demo buttons on the login page — sign in with the email and password.

| Role | Email |
|------|-------|
| Administrator | sara.admin.hms@gmail.com |
| Manager | omar.manager.hms@gmail.com |
| Receptionist | hina.reception.hms@gmail.com |
| Housekeeping | bilal.housekeeping.hms@gmail.com |
| Housekeeping (supervisor) | nadia.housekeeping.hms@gmail.com |
| Guest (checked in to room 203) | ayesha.guest.hms@gmail.com |
| Other guests | daniel.hughes.hms@gmail.com, fatima.noor.hms@gmail.com, ahmed.mansoori.hms@gmail.com, zainab.malik.hms@gmail.com, lucas.martin.hms@gmail.com, usman.tariq.hms@gmail.com, mei.lin.hms@gmail.com |

> **Email warning:** these are made-up Gmail addresses, but some may belong to real people. Once SMTP is switched on,
> booking, invoice and password emails for these accounts would go to those inboxes. Before enabling email, replace
> them in `backend/src/scripts/seed.js` with Gmail addresses you own (Gmail also accepts `yourname+admin@gmail.com`,
> `yourname+guest@gmail.com` etc., which all arrive in your own inbox), then run `npm run seed` again.
>
> Before going live: change `SEED_PASSWORD`, run the seed once (or create your own admin), then ask every
> user to reset their password with **Forgot password?**. Never run `npm run seed` on a live database — it wipes all data.

---

## 3. Environment variables

`backend/.env` (copy from `backend/.env.example`):

| Variable | Meaning |
|----------|---------|
| `PORT` | API port, default `5000` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign login tokens — **change it** before deploying |
| `JWT_EXPIRES_IN` | Login session length, e.g. `7d` |
| `CLIENT_URL` | Frontend URL allowed by CORS (comma-separate several) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (keep private) |
| `SMTP_HOST` / `SMTP_PORT` | Mail server, e.g. `smtp.gmail.com` / `465` |
| `SMTP_USER` / `SMTP_PASS` | Mail account login (Gmail: an App Password) |
| `EMAIL_FROM` | Sender name and address shown to guests |
| `SEED_PASSWORD` | Password for all accounts created by `npm run seed` |

`frontend/.env` (copy from `frontend/.env.example`):

| Variable | Meaning |
|----------|---------|
| `VITE_API_URL` | Backend API base URL, default `http://localhost:5000/api` |

---

## 4. Useful scripts

| Folder | Command | What it does |
|--------|---------|--------------|
| backend | `npm run dev` | Start API with auto-restart (Node's built-in `--watch`) |
| backend | `npm start` | Start API (production) |
| backend | `npm run seed` | **Wipe** the database and load fresh demo data |
| backend | `npm run backup` | Export every collection to `backend/backups/<date>/*.json` |
| backend | `npm test` | Run unit tests (Node's built-in test runner) |
| frontend | `npm run dev` | Start the React app |
| frontend | `npm run build` | Production build into `frontend/dist` |

---

## 5. Testing the API with Postman

1. Open Postman → **Import** → choose `postman/LuxuryStay-HMS.postman_collection.json`.
2. Run **Auth → Login as Admin** (or any role). It uses the collection variable `password` (default `LuxuryStay@2026`); the token is saved automatically into `token`, and every other request uses it.
3. Try the folders in order: Rooms → Bookings → Front desk → Invoices, etc.
4. Requests that need an ID (`:id`) — copy an `_id` from a list response and paste it into the URL.

See `docs/API.md` for the full endpoint list.

---

## 6. Viewing the data in MongoDB Compass

Open Compass → connect to `mongodb://127.0.0.1:27017` → database **luxurystay_hms**.
Collections: `users, rooms, bookings, invoices, servicerequests, housekeepingtasks, maintenancerequests, feedbacks, notifications, settings`.

---

## 7. Features (mapped to the project brief)

| Requirement | Where |
|-------------|-------|
| Admin dashboard, roles & permissions | *Staff & roles* page: create staff, change role, activate/deactivate, permission matrix |
| Staff profiles | Admin creates manager / receptionist / housekeeping accounts |
| Guest profiles & preferences | *Guests* page (front office) and *My profile* (guest) |
| Room inventory, types, pricing, status | *Room board* (live floor view), add/edit/retire rooms |
| Images (Cloudinary) | Drag-and-drop uploads for room photos (up to 8, choose the cover), profile photos, maintenance photos and the homepage photo. Stored on Cloudinary as `{ url, publicId }` in MongoDB; removed photos are deleted from Cloudinary |
| Room booking & availability | Public *Rooms* search, room page booking, *New reservation* for staff, double-booking prevented |
| Real-time room status | Room board + automatic changes on check-in (occupied), check-out (cleaning), clean done (available), maintenance |
| Online & staff reservations with confirmation | Guest books online; front desk books walk-ins; booking code + notification |
| Check-in / check-out | *Front desk* page: key card number issued, bill calculated, invoice created, cleaning task created |
| Billing | Room nights + completed services + tax − discount; early departure charges nights actually stayed |
| Invoices (print / email) | Printable invoice page (print or save as PDF), email via the user's mail app, partial payments |
| Housekeeping | Task board (to do / in progress / done), assign, claim, report issue |
| Maintenance requests | Guests and staff report, managers track, room can be taken out of service, inspection after repair |
| Reports & analytics | Occupancy, revenue, ADR, RevPAR, revenue by room type, booking sources, ratings, CSV export |
| Demand forecast & pricing | 30-night on-the-books forecast with raise/keep/lower suggestions and one-click apply |
| Authentication & RBAC | JWT login, bcrypt passwords, role checks on every API route and every page; forgot/reset password by email; invitations for new staff |
| Email notifications | Booking confirmed/cancelled, check-in, invoice, payment, password reset/changed, welcome, invitation, feedback reply (branded HTML emails) |
| On-screen messages | React-Toastify for every success, error and new-notification message |
| Feedback & ratings | Guests rate stays, staff reply, managers publish to the website |
| Additional services | Room service, laundry, wake-up call, transport, spa — charges added to the bill |
| System settings | Hotel details, currency, tax, check-in/out times, standard rates, service prices, policies |
| Notifications | In-app alerts per role (new booking, cleaning needed, issue reported, etc.) |
| Security | Password hashing, JWT, rate-limited login, NoSQL-injection filter, security headers, CORS whitelist |
| Privacy (GDPR) | Consent at sign-up, marketing opt-in, download my data, close my account |
| Logging & monitoring | Every request logged with status and response time, `/api/health` endpoint |
| Backups | `npm run backup` (JSON export); use `mongodump` or Atlas backups in production |
| Tests | `npm test` — billing and date logic unit tests |
| Responsive & accessible | Phones, tablets and desktops: tables turn into cards and pop-ups become bottom sheets on phones. Keyboard focus styles, labels on every field, reduced-motion support |
| Look & feel | Poppins font, light/dark theme switch (remembered per browser), page and scroll animations |

---

## 8. Packages used (kept minimal on purpose)

**Backend:** `express`, `mongoose`, `dotenv`, `cors`, `bcryptjs`, `jsonwebtoken`, `cloudinary`, `nodemailer`. Images are sent as base64 from the browser, so no `multer` is needed.
**Frontend:** `react`, `react-dom`, `react-router-dom`, `axios`, `react-toastify` (+ `vite` as the dev server).
Icons, charts, modals, toasts and styles are all hand-written — no UI libraries.

---

## 9. Folder structure

```
backend/
├── server.js                 starts the server, connects MongoDB, prints status
├── src/
│   ├── app.js                express app: middleware + routes
│   ├── config/db.js          MongoDB connection
│   ├── config/cloudinary.js  Cloudinary connection
│   ├── config/mailer.js      SMTP (Nodemailer) connection
│   ├── emails/               branded HTML email layout + templates
│   ├── constants/            roles, statuses, permission matrix
│   ├── models/               Mongoose schemas (User, Room, Booking, Invoice, ...)
│   │   └── schemas/image.js  shared { url, publicId } image schema
│   ├── controllers/          business logic for each module
│   ├── routes/               URL → controller mapping (+ role checks)
│   ├── middleware/           auth, error handler, logger, rate limit, sanitizer, headers
│   ├── utils/                billing, dates, codes, images (Cloudinary), notifications, validation, logger
│   └── scripts/              seed.js (demo data), backup.js
└── tests/                    unit tests

frontend/src/
├── main.jsx, App.jsx         entry + providers
├── routes/                   page routing and role-protected routes
├── context/                  Auth, Settings, Theme (light/dark), Toast
├── services/                 one file per API module (axios)
├── hooks/useFetch.js         data loading helper
├── utils/                    formatting + constants (labels, sidebar menu)
├── components/
│   ├── ui/                   Icon, Modal, Badge, Field, charts, ImageUploader, Avatar, Reveal, CountUp, ThemeToggle ...
│   ├── layout/               public header/footer, dashboard sidebar/topbar
│   ├── rooms/ bookings/      feature components (key-card search, check-out, ...)
│   └── dashboard/            role overviews, maintenance form
├── pages/
│   ├── public/               Home, Rooms, Room detail, About, 404
│   ├── auth/                 Login, Register, Forgot password, Reset password
│   └── dashboard/            all workspace pages
└── styles/                   tokens (light + dark colours), base, components, public, dashboard, theme (look, motion, mobile), print
```

---

## 10. Common problems

| Problem | Fix |
|---------|-----|
| `MongoDB connection failed: connect ECONNREFUSED` | MongoDB is not running. Windows: open *Services* → start **MongoDB Server**. Or use an Atlas link in `MONGO_URI`. |
| Frontend says *Cannot reach the server* | Start the backend first (`npm run dev` in `/backend`) and check `VITE_API_URL`. |
| CORS error in the browser | Make sure `CLIENT_URL` in `backend/.env` matches the frontend address. |
| Port 5000 already in use | Change `PORT` in `backend/.env` and `VITE_API_URL` in `frontend/.env`. |
| Login says the session expired | Log in again — tokens expire after `JWT_EXPIRES_IN`, and changing a password signs out other devices. |
| Emails are not arriving | Check the backend terminal for `Email sent` or the error. Gmail needs an **App Password**, not your normal password. Look in spam. |
| Forgot the admin password | Use *Forgot password?* (needs SMTP), or set `SEED_PASSWORD` and run `npm run seed` on a test database. |
| "Image uploads are not set up" | Add the three `CLOUDINARY_*` keys to `backend/.env` and restart the backend. |
| Upload fails with a Cloudinary error | Check the keys (no spaces), your internet connection, and that the image is under 5 MB after resizing. |
| Room photos don't show | Without Cloudinary keys the demo photos load from Unsplash and need internet. Upload your own from *Room board → Edit details*. |

More detail: `docs/API.md` (developers) and `docs/USER_GUIDE.md` (hotel staff and guests).
