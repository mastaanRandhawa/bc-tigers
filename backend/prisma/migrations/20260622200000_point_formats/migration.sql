-- CreateTable
CREATE TABLE "PointFormat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "win" INTEGER NOT NULL,
    "draw" INTEGER NOT NULL,
    "loss" INTEGER NOT NULL,
    "bonuses_enabled" BOOLEAN NOT NULL DEFAULT false,
    "shutout_bonus" INTEGER NOT NULL DEFAULT 0,
    "goal_bonus_per_goal" INTEGER NOT NULL DEFAULT 0,
    "goal_bonus_cap" INTEGER NOT NULL DEFAULT 0,
    "apply_bonuses_on_loss" BOOLEAN NOT NULL DEFAULT false,
    "forfeit_win_score" INTEGER NOT NULL DEFAULT 2,
    "forfeit_loss_score" INTEGER NOT NULL DEFAULT 0,
    "forfeit_award_bonuses" BOOLEAN NOT NULL DEFAULT true,
    "tiebreakers" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PointFormat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PointFormat_name_key" ON "PointFormat"("name");
CREATE UNIQUE INDEX "PointFormat_slug_key" ON "PointFormat"("slug");

-- Seed default formats
INSERT INTO "PointFormat" (
    "id", "name", "slug", "description", "is_system",
    "win", "draw", "loss",
    "bonuses_enabled", "shutout_bonus", "goal_bonus_per_goal", "goal_bonus_cap", "apply_bonuses_on_loss",
    "forfeit_win_score", "forfeit_loss_score", "forfeit_award_bonuses",
    "tiebreakers", "updated_at"
) VALUES
(
    'pf-standard-soccer',
    'Standard Soccer (3 Point System)',
    'standard-soccer-3-point',
    'Traditional win 3 / draw 1 / loss 0 with no bonus points.',
    true,
    3, 1, 0,
    false, 0, 0, 0, false,
    2, 0, false,
    '["GOAL_DIFFERENCE","GOALS_FOR","HEAD_TO_HEAD","FAIR_PLAY","COIN_TOSS"]'::jsonb,
    CURRENT_TIMESTAMP
),
(
    'pf-usfa-10-point',
    'USFA 10-Point System',
    'usfa-10-point',
    'Win 6 / draw 3 / loss 0, +1 shutout, +1 per goal (max 3). Forfeit 2-0. Max 10 pts per match.',
    true,
    6, 3, 0,
    true, 1, 1, 3, true,
    2, 0, true,
    '["HEAD_TO_HEAD","GOALS_AGAINST","GOALS_FOR","FAIR_PLAY","COIN_TOSS"]'::jsonb,
    CURRENT_TIMESTAMP
);

-- AlterTable Division
ALTER TABLE "Division" ADD COLUMN "point_format_id" TEXT;

UPDATE "Division" SET "point_format_id" = 'pf-standard-soccer';

ALTER TABLE "Division" ALTER COLUMN "point_format_id" SET NOT NULL;

ALTER TABLE "Division" DROP COLUMN "points_win";
ALTER TABLE "Division" DROP COLUMN "points_draw";
ALTER TABLE "Division" DROP COLUMN "points_loss";

ALTER TABLE "Division" ADD CONSTRAINT "Division_point_format_id_fkey"
    FOREIGN KEY ("point_format_id") REFERENCES "PointFormat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
