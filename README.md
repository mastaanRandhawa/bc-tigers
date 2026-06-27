# BC Tigers — Tournament Platform

Full-stack web app for **BC Tigers FC** tournament operations and the public fan
experience. Manage tournaments, divisions, teams, schedules, live scores,
standings, and knockout brackets. Staff roles (**SUPERADMIN**, **ADMIN**) run the
back office and **COACH**es self-manage their own team's roster; everything else
is a public, read-only fan site.

**Stack:** React (Vite) + TypeScript + Tailwind · NestJS + Prisma + PostgreSQL · Socket.IO

> 📖 **Non-technical walkthrough:** see the illustrated
> [**User Guide**](docs/client-guide/USER-GUIDE.md) for a complete, screenshot-by-screenshot
> tour of everything the site can do (fan, coach, and admin).

---

## Quick start

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Backend

```bash
cd backend
cp .env.example .env   # set DATABASE_URL, JWT_SECRET
npm install
npx prisma migrate dev
npm run seed          # demo data
npm run start:dev     # http://localhost:3000/api
```

Prisma schema lives in `backend/prisma/schema.prisma`.

### Frontend

```bash
cd frontend
cp .env.example .env   # optional; dev defaults work out of the box
npm install
npm run dev           # http://localhost:5173
```

---

## Architecture (enforced hierarchy)

This is a **competition hierarchy**, not a flat directory:

`Home → Tournaments → Division → Team → Player → Match`

- No global `/teams`, `/divisions`, or `/players` routes — they redirect to `/tournaments`.
- Public UI stays hierarchical; admin CRUD under `/admin/*` is flat.
- Pattern: Page → React Query hook → Axios service → REST `/api`. Realtime via Socket.IO.

---

## Authentication & roles

Roles: **`SUPERADMIN`** > **`ADMIN`** > **`COACH`**.

- **Staff** (`SUPERADMIN`/`ADMIN`) — back-office CRUD, guarded by `@AdminOnly()`
  (JWT + role check). Only a `SUPERADMIN` may create, modify, delete, or reset the
  password of another `ADMIN`/`SUPERADMIN` account.
- **Coaches** — self-register at `/coach/register`, then require **admin approval**
  before they can sign in. Once approved they manage only their assigned team's
  roster, guarded by `@CoachOnly()` + ownership/lock guards.
- **Public** read endpoints need no auth.

**Passwords are admin-managed.** There is no self-service password change, and the
`/forgot-password` flow directs users to contact an administrator (admins reset
passwords from `/admin/users`). The JWT is re-validated against the database on
every request, so deactivating, deleting, or un-approving an account revokes
access immediately.

---

## Site map

### Public (no login)

| URL | Page |
|-----|------|
| `/` | Home — featured tournaments, live/recent/upcoming matches, announcements |
| `/live` | Live matches |
| `/tournaments` | Tournaments list (search) |
| `/tournaments/:tournamentSlug` | Tournament detail + division directory |
| `/matches/:matchId` | Match resolver → division-scoped match page |

**Division hub** — `/tournaments/:tournamentSlug/divisions/:divisionSlug`

| URL (under division) | Page |
|----------------------|------|
| `/` (index) | Overview |
| `/teams`, `/teams/:teamSlug` | Teams + team detail (roster) |
| `/teams/:teamSlug/players/:playerId` | Player profile |
| `/matches`, `/matches/:matchId` | Matches list + detail |
| `/standings` | Standings table |
| `/stats` | Stats hub — **placeholder ("coming soon"); no backend stats module yet** |
| `/brackets` | Knockout bracket view |
| `/venues`, `/venues/:venueSlug` | Venues + venue detail |

**Legacy redirects:** `/schedule/:divisionSlug`, `/standings/:divisionSlug`,
`/brackets/:divisionSlug`, and various in-division aliases redirect to the
canonical routes above.

### Authentication

| URL | Page |
|-----|------|
| `/login` | Sign in |
| `/coach/register` | Coach self-registration (requires admin approval) |
| `/forgot-password` | Shows "contact your administrator" (passwords are admin-managed) |
| `/profile` | Edit profile (name, phone, image) — passwords are admin-managed |

> Staff accounts are created by an admin under `/admin/users`. Coaches self-register
> at `/coach/register` and become active once an admin approves them.

### Admin panel (`ADMIN` only)

| URL | Section |
|-----|---------|
| `/admin/dashboard` | Dashboard |
| `/admin/tournaments` | Tournaments CRUD (+ `/admin/tournaments/:id` workspace) |
| `/admin/divisions` | Divisions CRUD |
| `/admin/teams` | Teams CRUD |
| `/admin/matches` | Matches CRUD, scores, events, officials |
| `/admin/brackets` | Bracket generation + visual editor |
| `/admin/venues` | Venues & fields CRUD |
| `/admin/users` | User accounts |
| `/admin/announcements` | Announcements CRUD |

---

## Features

- **Live scores:** Socket.IO pushes match/standings/bracket updates; standings
  auto-recalculate when a match completes.
- **Match events:** goals, own goals, yellow/red cards, substitutions.
- **Standings:** configurable win/draw/loss points per division; materialized in a
  `Standing` table and recalculated on demand.
- **Brackets:** seeded knockout generation with a drag-and-drop admin editor.
- **Search:** debounced client-side search across long lists.

---

## Backend API modules

NestJS modules under `backend/src/modules/` (plus `gateways/` for WebSocket and
`prisma/` for the client):

| Module | Purpose |
|--------|---------|
| `auth` | Login, JWT, password reset |
| `users` | Admin user management |
| `tournaments` | Tournaments CRUD |
| `divisions` | Divisions + public division resources |
| `teams` | Teams & rosters (team-players) |
| `matches` | Matches, events, officials |
| `standings` | Standings & recalculation |
| `brackets` | Bracket nodes & generation |
| `venues` | Venues & fields |
| `settings` | Site settings (singleton) |
| `announcements` | Announcements |
| `hub` | Aggregated home-page payload + global search |
| `audit-log` | Admin action log |
| `health` | DB health check (ops) |
| `mail` | Password-reset email (Nodemailer) |

Base prefix: `/api`. Database schema: `backend/prisma/schema.prisma`.

---

## Seed data

`npm run seed` (in `backend/`) clears and rebuilds the **Miri Piri 2026** demo
tournament:

- **1 tournament** — `miri-piri-2026`
- **7 divisions** — Premier, Div 1 Gold, Div 2 Silver, Div 3 Bronze, Recreational, Over 40, Over 45
- **Up to 8 teams per division** (`SEED_MAX_TEAMS_PER_DIVISION`, default 8) × **5 players per team**
- **Newton Athletic Park** with fields, plus sample matches and standings
- Two staff users — `superadmin@bctigers.ca` and `admin@bctigers.ca`. Local/demo
  passwords are in `backend/prisma/seed.ts`; in production set
  `SEED_ADMIN_PASSWORD` / `SEED_SUPERADMIN_PASSWORD` (the seed refuses to run with
  the demo passwords when `NODE_ENV=production`).

> ⚠️ **The seed is destructive** — it wipes every table before inserting demo
> data. It refuses to run when `NODE_ENV=production` unless `ALLOW_PROD_SEED=true`.

---

## Environment

**Backend** (`backend/.env`, see `backend/.env.example`):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Required — app won't start without it |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `CORS_ORIGIN` | Comma-separated allowed browser origins (REST + WebSocket) |
| `APP_URL` | Frontend base URL for password-reset links |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Password-reset email delivery |
| `DEV_EXPOSE_RESET_TOKEN` | Dev only — never enable in production |
| `SEED_ADMIN_PASSWORD` / `SEED_SUPERADMIN_PASSWORD` | Seeded admin passwords — required in production |
| `ALLOW_PROD_SEED` | Explicit opt-in to run the destructive seed against a prod DB |

**Frontend** (`frontend/.env`, see `frontend/.env.example`):

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Backend REST URL incl. `/api` (dev proxies to `localhost:3000`) |
| `VITE_SOCKET_URL` | Socket.IO origin |

---

## Deployment

| | URL |
|--|-----|
| **Frontend** | https://tournament.bctigers.com |
| **API** | https://bc-tigers-lag7.onrender.com/api |

- **Render:** backend API + PostgreSQL via `render.yaml`. Set `CORS_ORIGIN` and
  SMTP secrets in the dashboard. Migrations run on deploy (`start:render`).
- **GitHub Pages:** Settings → Pages → Source: **GitHub Actions**. DNS CNAME:
  `tournament.bctigers.com` → `mastaanrandhawa.github.io`. Add the same custom
  domain under **bc-tigers** repo → Settings → Pages. The build uses base `/`
  (custom domain root). Enable **Enforce HTTPS** once the certificate is issued.
- **CI:** `.github/workflows/ci.yml` builds the frontend and runs backend tests
  on every PR.

---

## Project structure

```
bc-tigers/
├── frontend/          # React + Vite app
│   └── src/{pages,components,hooks,services,lib,routes}
├── backend/           # NestJS API
│   ├── prisma/        # schema, migrations, seed.ts
│   └── src/{modules,gateways,common,prisma}
├── docs/
│   ├── client-guide/  # illustrated end-user guide (USER-GUIDE.md + screenshots)
│   └── audits/        # engineering audit reports
└── README.md
```
