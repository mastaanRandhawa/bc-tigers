-- CreateEnum
CREATE TYPE "MatchSlotOutcome" AS ENUM ('WINNER', 'LOSER');

-- DropForeignKey: team slots become nullable, so their FKs switch to SET NULL
ALTER TABLE "Match" DROP CONSTRAINT IF EXISTS "Match_home_team_id_fkey";
ALTER TABLE "Match" DROP CONSTRAINT IF EXISTS "Match_away_team_id_fkey";

-- AlterTable: allow placeholder matches whose teams are not yet known
ALTER TABLE "Match" ALTER COLUMN "home_team_id" DROP NOT NULL,
ALTER COLUMN "away_team_id" DROP NOT NULL;

-- AlterTable: placeholder source slots (WINNER/LOSER of another match)
ALTER TABLE "Match" ADD COLUMN     "home_source_match_id" TEXT,
ADD COLUMN     "home_source_outcome" "MatchSlotOutcome",
ADD COLUMN     "away_source_match_id" TEXT,
ADD COLUMN     "away_source_outcome" "MatchSlotOutcome";

-- CreateTable
CREATE TABLE "TeamOfficial" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamOfficial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Match_home_source_match_id_idx" ON "Match"("home_source_match_id");

-- CreateIndex
CREATE INDEX "Match_away_source_match_id_idx" ON "Match"("away_source_match_id");

-- CreateIndex
CREATE INDEX "TeamOfficial_team_id_idx" ON "TeamOfficial"("team_id");

-- AddForeignKey: re-add team-slot FKs with SET NULL to match the now-optional relations
ALTER TABLE "Match" ADD CONSTRAINT "Match_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_home_source_match_id_fkey" FOREIGN KEY ("home_source_match_id") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_away_source_match_id_fkey" FOREIGN KEY ("away_source_match_id") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamOfficial" ADD CONSTRAINT "TeamOfficial_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
