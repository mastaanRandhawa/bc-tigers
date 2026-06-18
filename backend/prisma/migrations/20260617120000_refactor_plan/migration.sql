-- Refactor plan: admin-only auth, team-scoped players, match officials
-- Idempotent: safe to re-run after a partial failure

DROP TABLE IF EXISTS "Organization";

CREATE TABLE IF NOT EXISTS "MatchOfficial" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MAIN',
    "email" TEXT,
    "phone" TEXT,
    CONSTRAINT "MatchOfficial_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'MatchReferee'
  ) THEN
    INSERT INTO "MatchOfficial" ("id", "match_id", "name", "role", "email", "phone")
    SELECT
      mr."id",
      mr."match_id",
      CONCAT(r."first_name", ' ', r."last_name"),
      mr."role",
      r."email",
      r."phone"
    FROM "MatchReferee" mr
    JOIN "Referee" r ON r."id" = mr."referee_id"
    ON CONFLICT ("id") DO NOTHING;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "MatchOfficial_match_id_idx" ON "MatchOfficial"("match_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MatchOfficial_match_id_fkey'
  ) THEN
    ALTER TABLE "MatchOfficial" ADD CONSTRAINT "MatchOfficial_match_id_fkey"
      FOREIGN KEY ("match_id") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "team_id" TEXT;
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'TeamRoster'
  ) THEN
    UPDATE "Player" p
    SET "team_id" = sub."team_id",
        "active" = COALESCE(sub."active", true)
    FROM (
      SELECT DISTINCT ON (tr."player_id")
        tr."player_id",
        tr."team_id",
        tr."active"
      FROM "TeamRoster" tr
      ORDER BY tr."player_id", tr."active" DESC, tr."joined_at" DESC
    ) sub
    WHERE p."id" = sub."player_id";

    INSERT INTO "Player" (
      "id", "first_name", "last_name", "slug", "dob", "nationality",
      "jersey_number", "preferred_position", "profile_image", "team_id", "active",
      "created_at", "updated_at"
    )
    SELECT
      gen_random_uuid()::text,
      p."first_name",
      p."last_name",
      p."slug" || '-' || substr(tr."team_id", 1, 8),
      p."dob",
      p."nationality",
      p."jersey_number",
      p."preferred_position",
      p."profile_image",
      tr."team_id",
      tr."active",
      p."created_at",
      NOW()
    FROM "TeamRoster" tr
    JOIN "Player" p ON p."id" = tr."player_id"
    WHERE tr."team_id" != p."team_id"
      AND tr."player_id" IN (
        SELECT "player_id" FROM "TeamRoster" GROUP BY "player_id" HAVING COUNT(DISTINCT "team_id") > 1
      );
  END IF;
END $$;

UPDATE "Player"
SET "team_id" = (SELECT "id" FROM "Team" ORDER BY "created_at" ASC LIMIT 1)
WHERE "team_id" IS NULL
  AND EXISTS (SELECT 1 FROM "Team" LIMIT 1);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Player' AND column_name = 'team_id'
      AND is_nullable = 'YES'
  ) AND NOT EXISTS (SELECT 1 FROM "Player" WHERE "team_id" IS NULL) THEN
    ALTER TABLE "Player" ALTER COLUMN "team_id" SET NOT NULL;
  END IF;
END $$;

ALTER TABLE "Player" DROP CONSTRAINT IF EXISTS "Player_user_id_key";
ALTER TABLE "Player" DROP COLUMN IF EXISTS "user_id";

DROP INDEX IF EXISTS "Player_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Player_team_id_slug_key" ON "Player"("team_id", "slug");
CREATE INDEX IF NOT EXISTS "Player_team_id_last_name_idx" ON "Player"("team_id", "last_name");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Player_team_id_fkey'
  ) THEN
    ALTER TABLE "Player" ADD CONSTRAINT "Player_team_id_fkey"
      FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DROP TABLE IF EXISTS "TeamRoster";
DROP TABLE IF EXISTS "TeamCoach";
DROP TABLE IF EXISTS "Coach";
DROP TABLE IF EXISTS "MatchReferee";
DROP TABLE IF EXISTS "Referee";
DROP TABLE IF EXISTS "TournamentAdmin";

UPDATE "User" SET "role" = 'ADMIN' WHERE "role"::text != 'ADMIN';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'UserRole' AND e.enumlabel != 'ADMIN'
  ) AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole_old') THEN
    ALTER TYPE "UserRole" RENAME TO "UserRole_old";
    CREATE TYPE "UserRole" AS ENUM ('ADMIN');
    ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING ('ADMIN'::"UserRole");
    ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
    DROP TYPE "UserRole_old";
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Notification_user_id_read_created_at_idx"
  ON "Notification"("user_id", "read", "created_at");

CREATE TABLE IF NOT EXISTS "SiteSettings" (
    "id" TEXT NOT NULL,
    "site_name" TEXT NOT NULL DEFAULT 'BC Tigers Soccer',
    "contact_email" TEXT NOT NULL DEFAULT 'info@bctigers.ca',
    "contact_phone" TEXT,
    "contact_address" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Vancouver',
    "registration_open" BOOLEAN NOT NULL DEFAULT false,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "live_score_updates" BOOLEAN NOT NULL DEFAULT true,
    "max_teams_per_division" INTEGER NOT NULL DEFAULT 10,
    "points_win" INTEGER NOT NULL DEFAULT 3,
    "points_draw" INTEGER NOT NULL DEFAULT 1,
    "points_loss" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PasswordResetToken_user_id_fkey'
  ) THEN
    ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "SiteSettings" ("id", "registration_open", "updated_at")
VALUES ('default', false, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET "registration_open" = false;
