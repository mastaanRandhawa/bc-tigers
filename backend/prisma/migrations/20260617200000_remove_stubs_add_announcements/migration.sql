-- Create Announcement table and migrate broadcast notifications
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ANNOUNCEMENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Announcement" ("id", "tournament_id", "title", "message", "type", "created_at", "updated_at")
SELECT "id", "tournament_id", "title", "message", COALESCE("type", 'ANNOUNCEMENT'), "created_at", "created_at"
FROM "Notification"
WHERE "user_id" IS NULL;

CREATE INDEX "Announcement_created_at_idx" ON "Announcement"("created_at");

ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_tournament_id_fkey"
    FOREIGN KEY ("tournament_id") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop removed models
DROP TABLE IF EXISTS "PlayerStat";
DROP TABLE IF EXISTS "Media";
DROP TABLE IF EXISTS "Notification";

DROP TYPE IF EXISTS "MediaType";

-- Slim SiteSettings
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "registration_open";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "notifications_enabled";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "live_score_updates";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "max_teams_per_division";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "points_win";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "points_draw";
ALTER TABLE "SiteSettings" DROP COLUMN IF EXISTS "points_loss";
