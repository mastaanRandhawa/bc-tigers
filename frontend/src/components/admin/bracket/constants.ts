import type { BracketStage } from '@/types';

export const STAGE_ORDER: BracketStage[] = [
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'FINAL',
  'THIRD_PLACE',
];

export const STAGE_LABELS: Record<BracketStage, string> = {
  ROUND_OF_16: 'Round of 16',
  QUARTER_FINAL: 'Quarter Finals',
  SEMI_FINAL: 'Semi Finals',
  THIRD_PLACE: '3rd Place',
  FINAL: 'Final',
};

export const MATCH_ROW_HEIGHT = 48;
export const MATCH_CARD_MIN_HEIGHT = 112;
