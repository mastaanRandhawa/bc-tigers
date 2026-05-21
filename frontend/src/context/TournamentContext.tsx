import { createContext, useContext } from 'react';
import type { Tournament } from '@/types';

export interface TournamentRouteContextValue {
  tournament: Tournament;
  tournamentSlug: string;
  basePath: string;
}

const TournamentContext = createContext<TournamentRouteContextValue | null>(null);

export function TournamentProvider({
  value,
  children,
}: {
  value: TournamentRouteContextValue;
  children: React.ReactNode;
}) {
  return (
    <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>
  );
}

export function useTournamentRoute() {
  const ctx = useContext(TournamentContext);
  if (!ctx) {
    throw new Error('useTournamentRoute must be used within TournamentProvider');
  }
  return ctx;
}

export function useOptionalTournamentRoute() {
  return useContext(TournamentContext);
}
