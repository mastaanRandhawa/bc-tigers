-- Match team slots become nullable so a fixture can hold a bracket/pool
-- placeholder ("Winner of Match 11", "Pool A 1st") instead of a real team.
ALTER TABLE "Match" ALTER COLUMN "home_team_id" DROP NOT NULL;
ALTER TABLE "Match" ALTER COLUMN "away_team_id" DROP NOT NULL;

-- Display text used when the corresponding team is not yet known.
ALTER TABLE "Match" ADD COLUMN "home_label" TEXT;
ALTER TABLE "Match" ADD COLUMN "away_label" TEXT;
