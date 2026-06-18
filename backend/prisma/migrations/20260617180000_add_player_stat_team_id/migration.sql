-- PlayerStat.team_id was in schema but never migrated

ALTER TABLE "PlayerStat" ADD COLUMN IF NOT EXISTS "team_id" TEXT;

UPDATE "PlayerStat" ps
SET "team_id" = p."team_id"
FROM "Player" p
WHERE ps."player_id" = p."id"
  AND ps."team_id" IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PlayerStat_team_id_fkey'
  ) THEN
    ALTER TABLE "PlayerStat" ADD CONSTRAINT "PlayerStat_team_id_fkey"
      FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
