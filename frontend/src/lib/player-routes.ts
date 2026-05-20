import type { Player } from '@/types';

/** Canonical public player URL segment (UUID). */
export function getPlayerPublicId(player: Pick<Player, 'id' | 'slug'>): string {
  return player.id;
}

export function matchesPlayerRef(
  player: Pick<Player, 'id' | 'slug'>,
  ref: string,
): boolean {
  return player.id === ref || player.slug === ref;
}
