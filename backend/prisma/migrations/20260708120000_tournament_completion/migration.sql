-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN "completed_at" TIMESTAMP(3),
ADD COLUMN "admin_editing_enabled" BOOLEAN NOT NULL DEFAULT true;
