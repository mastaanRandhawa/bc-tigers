-- Add active field to User (default true so existing users remain active)
ALTER TABLE "User" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- Add stream_url field to Match (nullable)
ALTER TABLE "Match" ADD COLUMN "stream_url" TEXT;
