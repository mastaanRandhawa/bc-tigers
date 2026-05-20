export const queryKeys = {
  hub: {
    home: ['hub', 'home'] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
  },
  tournaments: {
    all: (params?: object) => ['tournaments', params ?? {}] as const,
    detail: (slug: string) => ['tournaments', slug] as const,
  },
  divisions: {
    all: (params?: object) => ['divisions', params ?? {}] as const,
    byTournament: (tournamentSlug: string) => ['divisions', 'tournament', tournamentSlug] as const,
    detail: (tournamentSlug: string, divisionSlug: string) =>
      ['divisions', tournamentSlug, divisionSlug] as const,
    bySlugGlobal: (divisionSlug: string) => ['divisions', 'by-slug', divisionSlug] as const,
    resources: {
      teams: (tournamentSlug: string, divisionSlug: string) =>
        ['divisions', tournamentSlug, divisionSlug, 'teams'] as const,
      team: (tournamentSlug: string, divisionSlug: string, teamSlug: string) =>
        ['divisions', tournamentSlug, divisionSlug, 'teams', teamSlug] as const,
      players: (tournamentSlug: string, divisionSlug: string) =>
        ['divisions', tournamentSlug, divisionSlug, 'players'] as const,
      matches: (tournamentSlug: string, divisionSlug: string, params?: object) =>
        ['divisions', tournamentSlug, divisionSlug, 'matches', params ?? {}] as const,
      standings: (tournamentSlug: string, divisionSlug: string) =>
        ['divisions', tournamentSlug, divisionSlug, 'standings'] as const,
      topScorers: (tournamentSlug: string, divisionSlug: string, limit?: number) =>
        ['divisions', tournamentSlug, divisionSlug, 'stats', 'top-scorers', limit ?? 20] as const,
      topAssists: (tournamentSlug: string, divisionSlug: string, limit?: number) =>
        ['divisions', tournamentSlug, divisionSlug, 'stats', 'top-assists', limit ?? 20] as const,
      discipline: (tournamentSlug: string, divisionSlug: string, limit?: number) =>
        ['divisions', tournamentSlug, divisionSlug, 'stats', 'discipline', limit ?? 20] as const,
      bracket: (tournamentSlug: string, divisionSlug: string) =>
        ['divisions', tournamentSlug, divisionSlug, 'bracket'] as const,
      venues: (tournamentSlug: string, divisionSlug: string) =>
        ['divisions', tournamentSlug, divisionSlug, 'venues'] as const,
      venue: (tournamentSlug: string, divisionSlug: string, venueSlug: string) =>
        ['divisions', tournamentSlug, divisionSlug, 'venues', venueSlug] as const,
    },
  },
  teams: {
    all: (params?: object) => ['teams', params ?? {}] as const,
    detail: (slug: string) => ['teams', slug] as const,
  },
  players: {
    all: (params?: object) => ['players', params ?? {}] as const,
    detail: (slug: string) => ['players', slug] as const,
  },
  matches: {
    all: (params?: object) => ['matches', params ?? {}] as const,
    detail: (id: string) => ['matches', id] as const,
    live: ['matches', 'live'] as const,
  },
  standings: {
    byDivision: (divisionId: string) => ['standings', divisionId] as const,
  },
  brackets: {
    byDivision: (divisionSlug: string) => ['brackets', divisionSlug] as const,
  },
  venues: {
    all: (params?: object) => ['venues', params ?? {}] as const,
    detail: (slug: string) => ['venues', slug] as const,
  },
  referees: {
    all: (params?: object) => ['referees', params ?? {}] as const,
    detail: (id: string) => ['referees', id] as const,
  },
  stats: {
    topScorers: (params?: object) => ['stats', 'top-scorers', params ?? {}] as const,
    topAssists: (params?: object) => ['stats', 'top-assists', params ?? {}] as const,
    discipline: (params?: object) => ['stats', 'discipline', params ?? {}] as const,
    summary: ['stats', 'summary'] as const,
  },
  media: {
    all: (params?: object) => ['media', params ?? {}] as const,
  },
  settings: {
    public: ['settings', 'public'] as const,
    admin: ['settings', 'admin'] as const,
  },
  coaches: {
    all: ['coaches'] as const,
    detail: (id: string) => ['coaches', id] as const,
  },
  users: {
    all: (params?: object) => ['users', params ?? {}] as const,
    detail: (id: string) => ['users', id] as const,
  },
} as const;
