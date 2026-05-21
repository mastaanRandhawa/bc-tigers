-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WAITLISTED', 'PAID', 'CHECKED_IN');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'REFUNDED');

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN "registration_open_date" TIMESTAMP(3),
ADD COLUMN "registration_close_date" TIMESTAMP(3),
ADD COLUMN "entry_fee" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "TeamApplication" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "division_id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "team_id" TEXT,
    "team_name" TEXT NOT NULL,
    "team_city" TEXT,
    "team_logo" TEXT,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "review_notes" TEXT,
    "roster_data" JSONB,
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamApplication_coach_id_status_idx" ON "TeamApplication"("coach_id", "status");

-- CreateIndex
CREATE INDEX "TeamApplication_tournament_id_status_idx" ON "TeamApplication"("tournament_id", "status");

-- CreateIndex
CREATE INDEX "TeamApplication_division_id_status_idx" ON "TeamApplication"("division_id", "status");

-- AddForeignKey
ALTER TABLE "TeamApplication" ADD CONSTRAINT "TeamApplication_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamApplication" ADD CONSTRAINT "TeamApplication_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamApplication" ADD CONSTRAINT "TeamApplication_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamApplication" ADD CONSTRAINT "TeamApplication_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamApplication" ADD CONSTRAINT "TeamApplication_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
