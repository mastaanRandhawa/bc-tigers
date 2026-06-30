-- Positional placeholder sources: a match slot can reference a standings
-- position ("Pool A 1st", or a whole-division "1st") instead of a team or the
-- winner/loser of a specific match.
ALTER TABLE "Match"
  ADD COLUMN "home_source_group_id" TEXT,
  ADD COLUMN "home_source_rank"     INTEGER,
  ADD COLUMN "away_source_group_id" TEXT,
  ADD COLUMN "away_source_rank"     INTEGER;

CREATE INDEX "Match_home_source_group_id_idx" ON "Match"("home_source_group_id");
CREATE INDEX "Match_away_source_group_id_idx" ON "Match"("away_source_group_id");

ALTER TABLE "Match"
  ADD CONSTRAINT "Match_home_source_group_id_fkey"
    FOREIGN KEY ("home_source_group_id") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Match_away_source_group_id_fkey"
    FOREIGN KEY ("away_source_group_id") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
