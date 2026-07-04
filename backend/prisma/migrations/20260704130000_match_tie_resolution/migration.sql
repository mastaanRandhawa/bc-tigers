-- CreateEnum
CREATE TYPE "TieResolution" AS ENUM ('DRAW', 'PENALTIES');

-- AlterTable
ALTER TABLE "Match" ADD COLUMN "tie_resolution" "TieResolution";

-- Backfill: tied matches with decisive penalties → PENALTIES; other tied → DRAW
UPDATE "Match"
SET "tie_resolution" = 'PENALTIES'
WHERE "home_score" = "away_score"
  AND "home_penalties" IS NOT NULL
  AND "away_penalties" IS NOT NULL
  AND "home_penalties" <> "away_penalties";

UPDATE "Match"
SET "tie_resolution" = 'DRAW'
WHERE "home_score" = "away_score"
  AND "tie_resolution" IS NULL;
