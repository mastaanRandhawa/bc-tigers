# Post-Launch Backlog (Phase 6)

Refactors and improvements from the audits that are **out of launch scope**.
Each entry is written to be copy-pasteable into a GitHub issue. None should be
started without prioritization — they are deferred by design.

> To file these as GitHub issues, run them through `gh issue create` (titles
> below). They are kept here so the backlog survives without an issue tracker.

---

## Refactors

- **Split `BracketCanvas.tsx` (827 lines)** — extract drag-drop, node renderer,
  and toolbar into separate units. `frontend/src/components/admin/BracketCanvas.tsx`.
- **Split `MatchDetailPage.tsx` (544 lines)** — scoreboard, events timeline,
  officials panels. `frontend/src/pages/matches/MatchDetailPage.tsx`.
- **Split admin workspace pages** — `TournamentWorkspacePage`,
  `DivisionWorkspacePage` (~400 lines each); extract tab panels.
- **Extract `index.css` (857 lines)** into feature-scoped stylesheets.

## Backend architecture

- **DTOs with `class-validator` for all write endpoints** — replace the inline
  `Record<string, unknown>` bodies (now allowlist-guarded) with validated DTOs
  for email/UUID/enum/score-bounds/date-ordering checks.
- **Repository layer (optional)** — only if query complexity grows; services
  call Prisma directly today, which is fine at current scale.
- **Global exception filter** + structured logging / request IDs.

## Features

- **Stats system** — see `DECISIONS.md` item 2 (needs product decision first).
- **Pagination** — division matches use a hardcoded `limit: 200`; add real
  pagination. `division-resources.service.ts` / `useDivisionMatches`.

## Security (also in DECISIONS.md item 4)

- **httpOnly cookie auth** to replace `localStorage` JWT + CSRF protection.
- **Rate limiting** on auth endpoints (`@nestjs/throttler`).
- **Refresh tokens / shorter JWT expiry.**

## Performance

- **Logo optimization** — `logo.png` is ~277 KB; convert to WebP/SVG (~10–30 KB).
- **Dynamic-import `BracketCanvas`** inside `AdminBrackets` only.
- **`Cache-Control` headers** on public read endpoints (tournaments, standings).
- **Division socket rooms** instead of global `server.emit()` broadcasts.
- **Queue standings recalc** instead of synchronous recalc in the gateway.

## Tooling / CI

- **Repo-wide prettier/eslint formatting pass** so the backend `lint` job can
  become a **blocking** CI gate (currently non-blocking — see
  `.github/workflows/ci.yml`). The committed code predates the `prettier/prettier`
  eslint rule.
- **Frontend ESLint + Vitest** — no linter or test runner is configured.
- **`npm audit` in CI** + Dependabot/Renovate.

## Duplicate reads (kept intentionally for now)

- Standings: `GET /standings/:id` vs `.../divisions/:slug/standings`.
- Bracket: `GET /brackets/division/:id` vs `.../divisions/:slug/bracket`.
- Live matches: `GET /hub/live-matches` vs `GET /matches?status=LIVE`.

Keep until a breaking-change consolidation is approved.
