-- AlterTable: add independent roster public-display lock (separate from the coach-edit lock)
ALTER TABLE "SiteSettings" ADD COLUMN "rosters_public" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "rosters_public_scheduled_at" TIMESTAMP(3);

-- Backfill: preserve existing behaviour where the coach lock also published rosters.
UPDATE "SiteSettings"
SET "rosters_public" = "coach_management_locked",
    "rosters_public_scheduled_at" = "coach_lock_scheduled_at";
