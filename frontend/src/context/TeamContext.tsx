import { createContext, useContext } from 'react';
import type { Team } from '@/types';
import type { DivisionTheme } from '@/lib/division-theme';

export interface TeamRouteContextValue {
  team: Team;
  teamSlug: string;
  tournamentSlug: string;
  divisionSlug: string;
  basePath: string;
  theme: DivisionTheme;
}

const TeamContext = createContext<TeamRouteContextValue | null>(null);

export function TeamProvider({
  value,
  children,
}: {
  value: TeamRouteContextValue;
  children: React.ReactNode;
}) {
  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeamRoute() {
  const ctx = useContext(TeamContext);
  if (!ctx) {
    throw new Error('useTeamRoute must be used within TeamProvider');
  }
  return ctx;
}
