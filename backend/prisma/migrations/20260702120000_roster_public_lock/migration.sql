-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "rosters_public" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "rosters_public_scheduled_at" TIMESTAMP(3);
