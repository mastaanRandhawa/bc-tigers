-- Additive-only migration: audit trail, record versioning, and soft-delete.
-- Hand-applied (no reset) against the existing database. All statements are
-- idempotent and non-destructive — no existing data or columns are dropped.

-- CreateEnum: RecordStatus
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RecordStatus') THEN
    CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DECOMMISSIONED');
  END IF;
END$$;

-- AlterTable: Tournament — soft-delete / lifecycle columns
ALTER TABLE "Tournament"
  ADD COLUMN IF NOT EXISTS "deleted_at"    TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deleted_by"    TEXT,
  ADD COLUMN IF NOT EXISTS "is_deleted"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "record_status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable: Team — soft-delete / lifecycle columns
ALTER TABLE "Team"
  ADD COLUMN IF NOT EXISTS "deleted_at"    TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deleted_by"    TEXT,
  ADD COLUMN IF NOT EXISTS "is_deleted"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "record_status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable: AuditLog — enriched audit fields
ALTER TABLE "AuditLog"
  ADD COLUMN IF NOT EXISTS "previous_values" JSONB,
  ADD COLUMN IF NOT EXISTS "new_values"      JSONB,
  ADD COLUMN IF NOT EXISTS "ip_address"      TEXT,
  ADD COLUMN IF NOT EXISTS "user_agent"      TEXT,
  ADD COLUMN IF NOT EXISTS "request_id"      TEXT,
  ADD COLUMN IF NOT EXISTS "source"          TEXT,
  ADD COLUMN IF NOT EXISTS "notes"           TEXT;

-- CreateTable: RecordVersion (immutable, append-only version history)
CREATE TABLE IF NOT EXISTS "RecordVersion" (
  "id"                  TEXT NOT NULL,
  "entity_type"         TEXT NOT NULL,
  "entity_id"           TEXT NOT NULL,
  "version"             INTEGER NOT NULL,
  "previous_version_id" TEXT,
  "action"              TEXT NOT NULL,
  "changed_fields"      TEXT[],
  "old_values"          JSONB,
  "new_values"          JSONB,
  "user_id"             TEXT,
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecordVersion_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "Tournament_is_deleted_idx" ON "Tournament"("is_deleted");
CREATE INDEX IF NOT EXISTS "Team_is_deleted_idx" ON "Team"("is_deleted");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_idx" ON "AuditLog"("entity");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_id_idx" ON "AuditLog"("entity_id");
CREATE INDEX IF NOT EXISTS "AuditLog_user_id_idx" ON "AuditLog"("user_id");
CREATE INDEX IF NOT EXISTS "AuditLog_created_at_idx" ON "AuditLog"("created_at");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "RecordVersion_entity_type_entity_id_version_idx" ON "RecordVersion"("entity_type", "entity_id", "version");
CREATE INDEX IF NOT EXISTS "RecordVersion_user_id_idx" ON "RecordVersion"("user_id");
CREATE INDEX IF NOT EXISTS "RecordVersion_created_at_idx" ON "RecordVersion"("created_at");

-- Foreign key: RecordVersion.user_id -> User.id (nullable, set null on delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RecordVersion_user_id_fkey'
  ) THEN
    ALTER TABLE "RecordVersion"
      ADD CONSTRAINT "RecordVersion_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;
