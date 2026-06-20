# Open Product / Architecture Decisions

Items the audits surfaced that require a **product or owner decision** before any
code change. Per the refactor plan these are intentionally **not implemented** —
they are documented here for sign-off.

---

## 1. `Stage` model — implement or drop

- **Status:** Needs decision.
- **Evidence:** `backend/prisma/schema.prisma` defines `Stage` and
  `Match.stage_id`, but no application code ever reads or writes `prisma.stage`.
  The seed only calls `stage.deleteMany()`. `Match.stage_id` is always null.
- **Options:**
  - **A.** Implement a real group-stage feature (group standings → knockout).
  - **B.** Drop the `Stage` model and `Match.stage_id` via a migration.
- **Why it's blocked:** Removing a table/column is a schema migration with data
  implications; building the feature is net-new scope. Either way it's a product
  call, not a cleanup.

## 2. Division stats page / stats system

- **Status:** Needs decision.
- **Evidence:** `DivisionStatsPage` renders "Statistics coming soon" and is
  reachable from the division pill nav. There is **no backend stats module**
  (removed in the refactor). Enum values `ASSIST`/`PENALTY` exist but no handlers.
- **Options:**
  - **A.** Build a stats system (top scorers / assists / discipline) with a
    backend module and wire the page.
  - **B.** Remove the placeholder page + nav entry until stats are scoped.
- **Why it's blocked:** This is a feature decision. The page is currently left
  visible (clearly labelled "coming soon") rather than removed, pending sign-off.

## 3. Public, unauthenticated read endpoints

- **Status:** Confirm intent.
- **Evidence:** `GET /matches/:id` and `GET /teams/:teamId/players` are public
  (no auth). For a fan site this is likely intentional, but rosters/players are
  enumerable by UUID.
- **Decision needed:** Confirm these should stay public, or gate them.

## 4. Auth hardening follow-ups (tracked, not in launch scope)

These were explicitly deferred by the plan but should be scheduled:

- **httpOnly cookie auth** to replace `localStorage` JWT (XSS token theft risk).
- **Rate limiting** on `/auth/login`, `/auth/forgot-password`,
  `/auth/reset-password` (e.g. `@nestjs/throttler`).
- **Shorter JWT lifetime / refresh tokens** (currently `7d`).
- **DB SSL** `rejectUnauthorized: false` for remote hosts — enable verification
  with a proper CA in production.
- Ensure `DEV_EXPOSE_RESET_TOKEN` is never set in production.
