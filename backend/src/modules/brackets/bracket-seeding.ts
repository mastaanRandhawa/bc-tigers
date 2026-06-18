export type { BracketSeeding } from './scheduling/types';
export {
  bracketSizeForTeamCount,
  byeCountForTeamCount,
  nextPowerOfTwo,
} from './scheduling/bye-calculator';
export {
  standardSeedOrder,
  standardSeedPairs,
  buildFirstRoundSlots,
} from './scheduling/seed-order';
export { shuffleWithSeed as shuffleTeamIds } from './scheduling/seeding-strategy';
import { buildFirstRoundSlots } from './scheduling/seed-order';

/** @deprecated Use buildFirstRoundSlots */
export function standardFirstRoundPairs(
  teamIds: string[],
  bracketSize: number,
): Array<[string | null, string | null]> {
  return buildFirstRoundSlots(teamIds, bracketSize).map((s) => [
    s.homeTeamId,
    s.awayTeamId,
  ]);
}
