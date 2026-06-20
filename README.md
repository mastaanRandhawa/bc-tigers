# BC Tigers — Tournament Platform

Full-stack web app for **BC Tigers FC** tournament operations and the public fan
experience. Manage tournaments, divisions, teams, schedules, live scores,
standings, and knockout brackets. A single **ADMIN** role runs the back office;
everything else is a public, read-only fan site.

**Stack:** React (Vite) + TypeScript + Tailwind · NestJS + Prisma + PostgreSQL · Socket.IO

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

The schema defines a single role: **`ADMIN`**. There is **no public registration** —
login is rejected for any non-admin account. Admin mutations are guarded by
`@AdminOnly()` (JWT + role check). Public read endpoints need no auth.

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
| `/forgot-password` | Request password reset |
| `/reset-password` | Set new password (token from email) |
| `/profile` | Edit profile & change password (logged in) |

> There is no `/register` page — accounts are created by an admin under `/admin/users`.

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
- One admin user (`admin@bctigers.ca`) — see `backend/prisma/seed.ts` for the default password

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

**Frontend** (`frontend/.env`, see `frontend/.env.example`):

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Backend REST URL incl. `/api` (dev proxies to `localhost:3000`) |
| `VITE_SOCKET_URL` | Socket.IO origin |

---

## Deployment

| | URL |
|--|-----|
| **Frontend** | https://mastaanrandhawa.github.io/bc-tigers/ |
| **API** | https://bc-tigers.onrender.com/api |

- **Render:** backend API + PostgreSQL via `render.yaml`. Set `CORS_ORIGIN` and
  SMTP secrets in the dashboard. Migrations run on deploy (`start:render`).
- **GitHub Pages:** Settings → Pages → Source: **GitHub Actions**. Push to
  `main`/`master`; `.github/workflows/deploy-frontend.yml` builds with
  `GITHUB_PAGES=true` (base `/bc-tigers/`).
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
├── docs/audits/       # engineering audit reports
└── README.md
```
