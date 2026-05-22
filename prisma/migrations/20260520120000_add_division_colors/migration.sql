-- AlterTable (idempotent: safe if columns were added manually or a prior deploy partially applied)
ALTER TABLE "Division" ADD COLUMN IF NOT EXISTS "primary_color" TEXT;
ALTER TABLE "Division" ADD COLUMN IF NOT EXISTS "accent_color" TEXT;
