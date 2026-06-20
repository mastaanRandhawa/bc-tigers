# Tournament engine

Centralized, **configuration-driven** tournament rules. The engine is pure
TypeScript with **no Prisma or NestJS dependency** — callers map persisted
entities to the plain `MatchResult` / `StandingRow` shapes, run the engine, and
map results back. Every rule lives in a `TournamentConfig`, so one engine serves
multiple rule sets (USFA 10-point, traditional 3-point, custom) without code
changes.

## Configuration

`USFA_TOURNAMENT_CONFIG` is the default rule set. Build variants by deep-merging
an override (arrays such as `tiebreakers` are replaced, not merged):

```ts
import { resolveTournamentConfig, TRADITIONAL_TOURNAMENT_CONFIG } from './engine';

const config = resolveTournamentConfig({
  format: 'ROUND_ROBIN_THEN_KNOCKOUT',
  pointSystem: { win: 6 },            // override one field
  tiebreakers: ['HEAD_TO_HEAD', 'GOAL_DIFFERENCE', 'COIN_TOSS'],
  advancement: { teamsAdvancing: 8 },
});
```

Everything the host can tune: point system, advancement rules, number of
advancing teams / bracket size, tiebreak order, penalty-kick behavior, forfeit
handling, and the deterministic coin-toss seed.

## What it covers

| Concern | Entry point | Rule (USFA default) |
|---------|-------------|---------------------|
| Formats | `phasesForFormat` | round robin, knockout, RR → knockout |
| Scoring | `pointsFor`, `scoreMatch` | win 6 / draw 3 / loss 0, +1 shutout, +1/goal (cap 3) |
| Standings | `computeStandings` | ranked table with tiebreakers applied |
| Tiebreakers | (via config) | head-to-head → goals against → goals for → coin toss |
| Knockout | `resolveKnockoutMatch`, `resolveShootout` | single elimination, skip ET, ≥5 kicks then sudden death |
| Forfeits | `forfeitResult`, `isAutomaticForfeit`, `normalizeResult` | recorded 2-0; >10 min late auto-forfeits |
| Advancement | `selectAdvancingTeams`, `resolveBracketSize` | top N advance; bracket rounds up to power of two |

The point formula reproduces every worked USFA example: `3-0 = 10`, `2-0 = 9`,
`4-2 = 9`, `0-0 draw = 4`, `2-2 draw = 5`.

## Match rules

The computational rules are enforced (forfeit 2-0, >10-minute late forfeit,
penalty-kick resolution). The operational rules — unlimited substitutions, home
team listed first, home changes jerseys on a color clash, both teams provide a
ball, games may end early to keep schedule — are venue/officiating conventions
with no scoring effect and are not modeled here.

## Integration

`StandingsService` and `BracketsService` currently read the per-division
`points_win/draw/loss` columns. To adopt the engine, map a division's matches to
`MatchResult[]`, call `computeStandings` / `resolveKnockoutMatch`, and persist
the returned rows. Storing forfeit status and penalty-kick tallies on `Match`
(currently absent from the schema) unlocks forfeit scoring and the penalty-kick
tiebreaker end to end.

## Tests

`engine.spec.ts` covers the scoring examples, tiebreaker chains, shootout
mechanics, forfeits, advancement, and config resolution. Run with
`npx jest src/engine`.
