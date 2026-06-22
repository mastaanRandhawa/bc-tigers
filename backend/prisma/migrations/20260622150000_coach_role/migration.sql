-- CreateEnum extension: add COACH to UserRole
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'COACH';

-- User approval gate
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "approved" BOOLEAN NOT NULL DEFAULT false;

-- Backfill existing admins as approved
UPDATE "User" SET "approved" = true WHERE "role" = 'ADMIN';

-- Team coach assignment and management lock
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "contact_email" TEXT;
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "contact_phone" TEXT;
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "coach_user_id" TEXT;
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "management_locked" BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Team_coach_user_id_key'
  ) THEN
    ALTER TABLE "Team" ADD CONSTRAINT "Team_coach_user_id_key" UNIQUE ("coach_user_id");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Team_coach_user_id_fkey'
  ) THEN
    ALTER TABLE "Team"
      ADD CONSTRAINT "Team_coach_user_id_fkey"
      FOREIGN KEY ("coach_user_id") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Global coach management lock
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "coach_management_locked" BOOLEAN NOT NULL DEFAULT false;
