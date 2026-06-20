-- Admin-controlled bracket structure lock
ALTER TABLE "Division" ADD COLUMN IF NOT EXISTS "bracket_locked" BOOLEAN NOT NULL DEFAULT false;
