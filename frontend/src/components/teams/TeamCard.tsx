import { Shield, Pencil, Trash2 } from 'lucide-react';
import { divisionTeamPath } from '@/lib/division-routes';
import DirectoryCard from '@/components/shared/DirectoryCard';
import { AdminActionButton } from '@/components/admin/inline/AdminActionButton';
import { useCanAdminEdit } from '@/hooks/useCanAdminEdit';
import type { Team } from '@/types';

interface TeamCardProps {
  team: Team;
  tournamentSlug: string;
  divisionSlug: string;
  onEdit?: (team: Team) => void;
  onDelete?: (team: Team) => void;
}

export default function TeamCard({ team, tournamentSlug, divisionSlug, onEdit, onDelete }: TeamCardProps) {
  const href = divisionTeamPath(tournamentSlug, divisionSlug, team.slug);
  const color = team.primary_color ?? '#F48735';
  const canEdit = useCanAdminEdit();

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

  if (canEdit && (onEdit || onDelete)) {
    return (
      <div className="group relative">
        <DirectoryCard
          href={href}
          media={media}
          title={team.name}
          meta={meta || undefined}
          accentColor={color}
        />
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <AdminActionButton
              size="xs"
              variant="ghost"
              onClick={(e) => { e.preventDefault(); onEdit(team); }}
              aria-label={`Edit ${team.name}`}
            >
              <Pencil className="h-3 w-3" />
            </AdminActionButton>
          )}
          {onDelete && (
            <AdminActionButton
              size="xs"
              variant="destructive"
              onClick={(e) => { e.preventDefault(); onDelete(team); }}
              aria-label={`Delete ${team.name}`}
            >
              <Trash2 className="h-3 w-3" />
            </AdminActionButton>
          )}
        </div>
      </div>
    );
  }

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
