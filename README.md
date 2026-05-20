# BC Tigers — Tournament Platform

Full-stack web app for **BC Tigers FC** tournament operations and public fan experience. Manage tournaments, divisions, teams, schedules, live scores, standings, stats, and brackets — with role-based portals for coaches, referees, and players.

**Stack:** React (Vite) + TypeScript + Tailwind · NestJS + Prisma + PostgreSQL

---

## Quick start

### Prerequisites

- Node.js 20+
- PostgreSQL database
- `DATABASE_URL` in `backend/.env`

### Backend

```bash
cd backend
npm install
npx prisma migrate dev
npm run seed          # demo data (~90s)
npm run start:dev     # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev           # http://localhost:5173
```

Set the API base URL in frontend env if needed (see `frontend` Vite config / services).

---

## Demo logins (after seed)

| Role | Email | Password |
|------|--------|----------|
| Admin | `admin@bctigers.ca` | `Admin1234!` |
| Coach | `coach@bctigers.ca` | `demo1234` |
| Referee | `referee@bctigers.ca` | `demo1234` |
| Player | `player@bctigers.ca` | `demo1234` |
| Viewer | `viewer@bctigers.ca` | `demo1234` |

**Featured tournament (seed):** [14th Annual Miri Piri Soccer Tournament](http://localhost:5173/tournaments/miri-piri-2026)  
July 3–5, 2026 · Newton Athletic Park, Surrey · 20 divisions · 80 teams · sample matches in featured divisions

---

## User roles

| Role | Access |
|------|--------|
| **VIEWER** | Public site only |
| **PLAYER** | Public + `/player` portal |
| **COACH** | Public + `/coach` portal |
| **REFEREE** | Public + `/referee` portal |
| **TOURNAMENT_ADMIN** | Portals + admin (where allowed) |
| **ADMIN** | Full admin panel |

---

## Site map — all pages

### Public (no login)

| URL | Page | What you can do |
|-----|------|-----------------|
| `/` | **Home** | Hero hub; quick links to schedule, live/results, divisions; live matches; recent results; upcoming; tournament cards; search when many tournaments |
| `/tournaments` | **Tournaments list** | Browse all competitions; search by name, location, status |
| `/tournaments/:slug` | **Tournament detail** | Info, rules, dates, location; division directory; featured live/recent/upcoming matches; standings snapshot; top scorers; search divisions |

**Division hub** — `/tournaments/:tournamentSlug/divisions/:divisionSlug`

Each division has its own theme (colors) and pill navigation:

| URL (under division) | Page | Features |
|----------------------|------|----------|
| `/` (index) | **Overview** | Stats (teams, matches, live, leader); live/upcoming/recent match previews; standings snapshot |
| `/teams` | **Teams** | Team cards; search |
| `/teams/:teamSlug` | **Team detail** | Roster with player search; team matches with search |
| `/teams/:teamSlug/players/:playerId` | **Player profile** | Bio, position, stats |
| `/schedule` | **Schedule** | Matches grouped by day; search |
| `/matches` | **Matches** | Filter by status (all / live / scheduled / completed); search |
| `/matches/:matchId` | **Match detail** | Scoreline, status, venue, time, referee; match timeline (goals, cards, subs, assists) |
| `/standings` | **Standings** | Full table with form indicators; search |
| `/stats` | **Stats hub** | Links to leaderboards |
| `/stats/top-scorers` | **Top scorers** | Leaderboard + search |
| `/stats/top-assists` | **Top assists** | Leaderboard + search |
| `/stats/discipline` | **Discipline** | Cards leaderboard + search |
| `/brackets` | **Brackets** | Knockout bracket view |
| `/venues` | **Venues** | Venue list; search |
| `/venues/:venueSlug` | **Venue detail** | Address, parking; matches at venue; search |

**Legacy redirects** (old URLs → current division routes):

- `/schedule/:divisionSlug`
- `/standings/:divisionSlug`
- `/brackets/:divisionSlug`

### Authentication

| URL | Page |
|-----|------|
| `/login` | Sign in |
| `/register` | Create account |
| `/forgot-password` | Request reset |
| `/reset-password` | Set new password |
| `/profile` | Edit profile & change password (logged in) |

### Role portals (login required)

| URL | Portal | Features |
|-----|--------|----------|
| `/coach` | **Coach dashboard** | Stats; upcoming matches (search); assigned teams (search); links to schedule & tournaments |
| `/referee` | **Referee dashboard** | Today’s matches (search); live matches (search); assignment overview |
| `/player` | **Player dashboard** | Upcoming team matches (search); top scorers (search); quick links to schedule & stats |

### Admin panel (`ADMIN` only)

| URL | Section | Features |
|-----|---------|----------|
| `/admin/dashboard` | Dashboard | Division/team/live counts; links to public division pages |
| `/admin/tournaments` | Tournaments | CRUD; table search |
| `/admin/divisions` | Divisions | CRUD; colors, points rules; search |
| `/admin/venues` | Venues | CRUD; fields; search |
| `/admin/teams` | Teams | CRUD; division assignment; search |
| `/admin/players` | Players | CRUD; auto-generated slugs; roster ties; search |
| `/admin/matches` | Matches | CRUD; scores, status, referees; search |
| `/admin/schedules` | Schedules | Calendar-style match management; search |
| `/admin/standings` | Standings | Per-division tables; recalculate; search |
| `/admin/brackets` | Brackets | Pick division (search when 5+); generate bracket; visual tree |
| `/admin/referees` | Referees | CRUD; certifications; search |
| `/admin/users` | Users | User accounts & roles; search |
| `/admin/media` | Media | Add photos/videos/docs by URL; grid; search |
| `/admin/settings` | Settings | Site name, contact, registration toggles, notifications |

---

## Features by area

### Live scores & matches

- **Live score ticker** on division pages
- Match statuses: `SCHEDULED`, `LIVE`, `COMPLETED`, `POSTPONED`, `CANCELLED`
- **Match events:** goals, own goals, penalties, yellow/red cards, substitutions, assists
- Home hub API aggregates live, recent, and upcoming matches for fast home page load

### Standings & stats

- Points (configurable win/draw/loss per division)
- Rank, played, W-D-L, goals, form streak
- Player stats: goals, assists, cards, matches played
- Tournament- and division-scoped leaderboards

### Search (sitewide)

Debounced client-side search on long lists:

- Tournaments, divisions, teams, venues, players, matches, standings, stats, media
- Admin tables and portal dashboards (when lists are large enough)

Shared components: `SearchField`, `useListSearch`, `lib/search-text.ts`

### Players & URLs

- Player profiles use **UUID** in URLs (slug auto-generated on create, not edited in forms)
- Legacy `/players/:id` routes redirect to team-scoped player URLs

### Design & UX

- Division-specific **primary/accent** colors
- Shared design system: `page-container`, cards, `PillNav`, `StatCard`, `MatchCard`, `StandingsTable`
- Lazy-loaded routes with loading states
- React Query caching and prefetch on tournament links

---

## Seed data summary

The default seed builds **Miri Piri 2026**:

- **1 tournament** — `miri-piri-2026`, status `UPCOMING`, $70k prize pool copy, full rules text
- **20 divisions** — Premier, Gold, Silver, Bronze, U19, U14–U18, U6–U13, 6-a-side, Over 35/40/50, etc.
- **80 teams** (4 per division), **960 players** (12 per team)
- **Newton Athletic Park** — 4 grass fields, 6 referees
- **Sample matches** in 4 featured divisions with standings recalculated
- Portal users linked to coach team, referee record, and first player

Reseed (clears and rebuilds):

```bash
cd backend && npm run seed
```

---

## Backend API modules

NestJS modules under `backend/src/modules/`:

| Module | Purpose |
|--------|---------|
| `auth` | Login, register, JWT, password reset |
| `users` | User management |
| `tournaments` | Tournaments CRUD |
| `divisions` | Divisions + public division resources |
| `teams` | Teams & rosters |
| `players` | Players (slug generation, lookup by id/slug) |
| `matches` | Matches & events |
| `standings` | Standings & recalculation |
| `stats` | Leaderboards |
| `brackets` | Bracket nodes & generation |
| `venues` | Venues & fields |
| `referees` | Referees |
| `coaches` | Coaches & team assignments |
| `media` | Division media assets |
| `hub` | Aggregated home hub payload |
| `settings` | Site settings |
| `notifications` | User notifications |

Database schema: `backend/prisma/schema.prisma`  
Performance indexes on matches/standings where applicable.

---

## Project structure

```
bc-tigers/
├── frontend/          # React + Vite app
│   └── src/
│       ├── pages/     # Route pages (public, admin, portals)
│       ├── components/
│       ├── hooks/
│       ├── services/  # API clients
│       └── lib/       # routes, dates, search, themes
├── backend/           # NestJS API
│   ├── prisma/        # schema, migrations, seed.ts
│   └── src/modules/
└── README.md          # this file
```

---

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| `frontend` | `npm run dev` | Dev server |
| `frontend` | `npm run build` | Production build |
| `backend` | `npm run start:dev` | API with watch |
| `backend` | `npm run seed` | Load demo database |
| `backend` | `npx prisma migrate dev` | Apply migrations |

---

## Environment

**Backend** (`backend/.env`):

- `DATABASE_URL` — PostgreSQL connection string
- JWT and other secrets as required by `auth` module

**Frontend** (`frontend/.env.production`):

- `VITE_API_URL` — e.g. `https://bc-tigers.onrender.com/api`
- `VITE_SOCKET_URL` — e.g. `https://bc-tigers.onrender.com`

Dev uses Vite proxy (`/api` → `localhost:3000`); production build targets Render.

### GitHub Pages + Render

| | URL |
|--|-----|
| **Frontend** | https://mastaanrandhawa.github.io/bc-tigers/ |
| **API** | https://bc-tigers.onrender.com/api |

1. **Render:** set `CORS_ORIGIN` to `https://mastaanrandhawa.github.io,https://mastaanrandhawa.github.io/bc-tigers` (Origin header is usually without path; include both to be safe).
2. **GitHub:** Settings → Pages → Source: **GitHub Actions**.
3. Push to `main`; workflow `.github/workflows/deploy-frontend.yml` builds with `GITHUB_PAGES=true` (base `/bc-tigers/`).

---

## Contact (from seed / site settings)

- **Email:** bctigersfc@gmail.com  
- **Site:** www.bctigers.com  
- **Venue:** Newton Athletic Park, 7395 128 St, Surrey, BC V3W 2M7

---

*For component integration notes, see `21dev.md` in the repo root.*
