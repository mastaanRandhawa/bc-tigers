import type { Tournament } from '@/types';

interface TournamentShellProps {
  tournament: Tournament;
  children: React.ReactNode;
}

// The DivisionShell provides its own full header when inside a division.
// The TournamentDetailPage hero provides all tournament context on the overview.
// This component is kept as a thin provider boundary so the context hierarchy
// remains stable, but it adds no extra chrome of its own.
export default function TournamentShell({ children }: TournamentShellProps) {
  return <>{children}</>;
}
