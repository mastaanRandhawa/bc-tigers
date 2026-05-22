import { Shield } from 'lucide-react';
import { divisionTeamPath } from '@/lib/division-routes';
import DirectoryCard from '@/components/shared/DirectoryCard';
import type { Team } from '@/types';

interface TeamCardProps {
  team: Team;
  tournamentSlug: string;
  divisionSlug: string;
}

export default function TeamCard({ team, tournamentSlug, divisionSlug }: TeamCardProps) {
  const href = divisionTeamPath(tournamentSlug, divisionSlug, team.slug);
  const color = team.primary_color ?? '#F48735';

  const media = (
    <div
      className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg"
      style={{ backgroundColor: color }}
    >
      {team.logo ? (
        <img
          src={team.logo}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <Shield className="h-5 w-5 text-white/90" aria-hidden />
      )}
    </div>
  );

  const meta = [team.city, team.founded_year ? `Est. ${team.founded_year}` : undefined]
    .filter(Boolean)
    .join(' · ');

  return (
    <DirectoryCard
      href={href}
      media={media}
      title={team.name}
      meta={meta || undefined}
      accentColor={color}
    />
  );
}
