-- Many-to-many team ↔ division via TeamDivision (division-scoped slug + pool).

CREATE TABLE "TeamDivision" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "division_id" TEXT NOT NULL,
    "group_id" TEXT,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamDivision_pkey" PRIMARY KEY ("id")
);

-- Backfill from existing Team rows before dropping columns.
INSERT INTO "TeamDivision" ("id", "team_id", "division_id", "group_id", "slug", "created_at", "updated_at")
SELECT
    gen_random_uuid()::text,
    "id",
    "division_id",
    "group_id",
    "slug",
    "created_at",
    "updated_at"
FROM "Team";

CREATE UNIQUE INDEX "TeamDivision_team_id_division_id_key" ON "TeamDivision"("team_id", "division_id");
CREATE UNIQUE INDEX "TeamDivision_division_id_slug_key" ON "TeamDivision"("division_id", "slug");
CREATE INDEX "TeamDivision_division_id_idx" ON "TeamDivision"("division_id");
CREATE INDEX "TeamDivision_group_id_idx" ON "TeamDivision"("group_id");

ALTER TABLE "TeamDivision" ADD CONSTRAINT "TeamDivision_team_id_fkey"
    FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamDivision" ADD CONSTRAINT "TeamDivision_division_id_fkey"
    FOREIGN KEY ("division_id") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamDivision" ADD CONSTRAINT "TeamDivision_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop old single-division columns on Team.
ALTER TABLE "Team" DROP CONSTRAINT IF EXISTS "Team_division_id_fkey";
ALTER TABLE "Team" DROP CONSTRAINT IF EXISTS "Team_group_id_fkey";
DROP INDEX IF EXISTS "Team_division_id_slug_key";
DROP INDEX IF EXISTS "Team_group_id_idx";

ALTER TABLE "Team" DROP COLUMN "division_id";
ALTER TABLE "Team" DROP COLUMN "group_id";
ALTER TABLE "Team" DROP COLUMN "slug";
