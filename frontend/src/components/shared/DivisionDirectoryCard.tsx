import DivisionCard from '@/components/tournaments/DivisionCard';
import type { Division } from '@/types';

interface DivisionDirectoryCardProps {
  division: Division;
  description?: string;
}

/** @deprecated Use DivisionCard */
export default function DivisionDirectoryCard({ division }: DivisionDirectoryCardProps) {
  const tournamentSlug = division.tournament?.slug;
  if (!tournamentSlug) return null;

  return (
    <DivisionCard
      division={division}
      tournamentSlug={tournamentSlug}
      variant="row"
    />
  );
}
