import { createContext, useContext } from 'react';
import type { Tournament } from '@/types';

export type TournamentContextValue = {
  tournament: Tournament;
  tournamentSlug: string;
};

const TournamentContext = createContext<TournamentContextValue | null>(null);

export function TournamentProvider({
  value,
  children,
}: {
  value: TournamentContextValue;
  children: React.ReactNode;
}) {
  return (
    <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>
  );
}

export function useTournamentRoute() {
  const ctx = useContext(TournamentContext);
  if (!ctx) {
    throw new Error('useTournamentRoute must be used within TournamentLayout');
  }
  return ctx;
}

export function useTournamentRouteOptional() {
  return useContext(TournamentContext);
}
