/** Shared TanStack Query timing presets */
export const queryTiming = {
  /** Live scores, tickers */
  live: {
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchInterval: 20_000,
  },
  /** Home hub, tournament lists */
  feed: {
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  },
  /** Division detail, standings tables */
  standard: {
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  },
  /** Settings, rarely changing config */
  static: {
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  },
} as const;
