-- AlterTable
ALTER TABLE "Division" ADD COLUMN     "qualification_zones_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "qualification_advance" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "qualification_eliminate" INTEGER NOT NULL DEFAULT 2;

-- Backfill Miri Piri divisions that already used hardcoded qualification zones.
UPDATE "Division"
SET "qualification_zones_enabled" = true,
    "qualification_advance" = 8,
    "qualification_eliminate" = 2
WHERE "slug" = 'premier';

UPDATE "Division"
SET "qualification_zones_enabled" = true,
    "qualification_advance" = 2,
    "qualification_eliminate" = 2
WHERE "slug" IN ('div-1-gold', 'div-2-silver', 'div-3-bronze');
