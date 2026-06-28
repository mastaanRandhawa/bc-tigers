-- AlterTable: division group/order configuration
ALTER TABLE "Division" ADD COLUMN "groups_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Division" ADD COLUMN "display_order" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: Group (pool within a division)
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "division_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Group_division_id_slug_key" ON "Group"("division_id", "slug");
CREATE INDEX "Group_division_id_order_idx" ON "Group"("division_id", "order");

-- AlterTable: add nullable group_id FKs
ALTER TABLE "Team" ADD COLUMN "group_id" TEXT;
ALTER TABLE "Match" ADD COLUMN "group_id" TEXT;
ALTER TABLE "Standing" ADD COLUMN "group_id" TEXT;

CREATE INDEX "Team_group_id_idx" ON "Team"("group_id");
CREATE INDEX "Match_group_id_idx" ON "Match"("group_id");
CREATE INDEX "Standing_group_id_idx" ON "Standing"("group_id");

-- Foreign keys
ALTER TABLE "Group" ADD CONSTRAINT "Group_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Team" ADD CONSTRAINT "Team_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Standing" ADD CONSTRAINT "Standing_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
