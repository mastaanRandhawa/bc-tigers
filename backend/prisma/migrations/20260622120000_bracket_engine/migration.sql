-- Bracket engine: node status, progression links, division finalization.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BracketNodeStatus') THEN
    CREATE TYPE "BracketNodeStatus" AS ENUM (
      'PENDING',
      'READY',
      'IN_PROGRESS',
      'COMPLETED',
      'AUTO_ADVANCED',
      'INVALID'
    );
  END IF;
END$$;

ALTER TABLE "Division"
  ADD COLUMN IF NOT EXISTS "bracket_finalized" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "BracketNode"
  ADD COLUMN IF NOT EXISTS "status" "BracketNodeStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "next_node_id" TEXT,
  ADD COLUMN IF NOT EXISTS "next_slot" TEXT,
  ADD COLUMN IF NOT EXISTS "loser_next_node_id" TEXT,
  ADD COLUMN IF NOT EXISTS "loser_next_slot" TEXT,
  ADD COLUMN IF NOT EXISTS "auto_advanced" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMP(3);

-- Backfill status from existing data
UPDATE "BracketNode" bn
SET "status" = CASE
  WHEN bn."auto_advanced" = true OR (
    bn."winner_id" IS NOT NULL
    AND (bn."home_team_id" IS NULL OR bn."away_team_id" IS NULL)
  ) THEN 'AUTO_ADVANCED'::"BracketNodeStatus"
  WHEN bn."winner_id" IS NOT NULL THEN 'COMPLETED'::"BracketNodeStatus"
  WHEN bn."home_team_id" IS NOT NULL AND bn."away_team_id" IS NOT NULL THEN 'READY'::"BracketNodeStatus"
  WHEN bn."home_team_id" IS NULL AND bn."away_team_id" IS NULL THEN 'PENDING'::"BracketNodeStatus"
  ELSE 'PENDING'::"BracketNodeStatus"
END
WHERE bn."status" = 'PENDING'::"BracketNodeStatus";
