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
    byDivision: (divisionId: string) => ['brackets', divisionId] as const,
  },
  venues: {
    all: (params?: object) => ['venues', params ?? {}] as const,
    detail: (slug: string) => ['venues', slug] as const,
  },
  settings: {
    public: ['settings', 'public'] as const,
    admin: ['settings', 'admin'] as const,
  },
  users: {
    all: (params?: object) => ['users', params ?? {}] as const,
    detail: (id: string) => ['users', id] as const,
  },
  announcements: {
    all: () => ['announcements'] as const,
  },
} as const;
