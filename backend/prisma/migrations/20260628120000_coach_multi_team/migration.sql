-- Allow coaches to manage multiple teams (one coach per team, many teams per coach).
ALTER TABLE "Team" DROP CONSTRAINT IF EXISTS "Team_coach_user_id_key";

CREATE INDEX IF NOT EXISTS "Team_coach_user_id_idx" ON "Team"("coach_user_id");

-- Structured team requests from registration and coach portal.
CREATE TYPE "CoachTeamRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "CoachTeamRequest" (
    "id" TEXT NOT NULL,
    "coach_user_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "status" "CoachTeamRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachTeamRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CoachTeamRequest_coach_user_id_team_id_key" ON "CoachTeamRequest"("coach_user_id", "team_id");
CREATE INDEX "CoachTeamRequest_coach_user_id_idx" ON "CoachTeamRequest"("coach_user_id");
CREATE INDEX "CoachTeamRequest_team_id_idx" ON "CoachTeamRequest"("team_id");
CREATE INDEX "CoachTeamRequest_status_idx" ON "CoachTeamRequest"("status");

ALTER TABLE "CoachTeamRequest" ADD CONSTRAINT "CoachTeamRequest_coach_user_id_fkey" FOREIGN KEY ("coach_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachTeamRequest" ADD CONSTRAINT "CoachTeamRequest_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
