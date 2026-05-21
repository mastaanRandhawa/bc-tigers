import { Link } from 'react-router-dom';
import { ChevronRight, Calendar, Trophy, Users } from 'lucide-react';
import {
  divisionBasePath,
  divisionSchedulePath,
  divisionStandingsPath,
  divisionTeamsPath,
} from '@/lib/division-routes';
import { getDivisionTheme } from '@/lib/division-theme';
import type { Division } from '@/types';
import { cn } from '@/lib/utils';

interface DivisionCardProps {
  division: Division;
  tournamentSlug: string;
  variant?: 'grid' | 'row';
  className?: string;
}

export default function DivisionCard({
  division,
  tournamentSlug,
  variant = 'grid',
  className,
}: DivisionCardProps) {
  const href = divisionBasePath(tournamentSlug, division.slug);
  const theme = getDivisionTheme(division);
  const teamCount = division.teams?.length ?? 0;
  const matchCount = division._count?.matches;

  const quickActions = [
    { label: 'Standings', href: divisionStandingsPath(tournamentSlug, division.slug), icon: Trophy },
    { label: 'Schedule', href: divisionSchedulePath(tournamentSlug, division.slug), icon: Calendar },
    { label: 'Teams', href: divisionTeamsPath(tournamentSlug, division.slug), icon: Users },
  ];

  if (variant === 'row') {
    return (
      <Link
        to={href}
        className={cn('group ds-surface-interactive flex items-center gap-3 p-3', className)}
      >
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-foreground text-xs font-black uppercase"
          style={{
            backgroundColor: theme.accent,
            color: theme.primary,
          }}
          aria-hidden
        >
          {division.name.slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className="truncate text-sm font-black uppercase tracking-tight text-foreground transition-colors group-hover:text-primary"
            style={{ ['--hover' as string]: theme.primary }}
          >
            {division.name}
          </h3>
          <p className="mt-0.5 text-xs font-semibold text-foreground/55">
            {teamCount} teams{matchCount != null ? ` · ${matchCount} matches` : ''}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-foreground/30 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    );
  }

  return (
    <Link to={href} className={cn('group ds-surface-interactive relative flex flex-col overflow-hidden', className)}>
      <div
        className="h-1.5 w-full shrink-0 border-b-2 border-foreground"
        style={{ backgroundColor: theme.primary }}
        aria-hidden
      />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-foreground text-xs font-black uppercase tracking-wider"
            style={{
              backgroundColor: theme.accent,
              color: theme.primary,
            }}
            aria-hidden
          >
            {division.name.slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-black uppercase tracking-tight text-foreground transition-colors group-hover:text-primary">
              {division.name}
            </h3>
            <div className="mt-2 flex flex-wrap gap-1">
              {division.age_group && (
                <span className="division-badge">{division.age_group}</span>
              )}
              <span className="division-badge">{division.format}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-4 text-xs font-bold uppercase tracking-wide text-foreground/60">
          <span>{teamCount} teams</span>
          {matchCount != null && <span>{matchCount} matches</span>}
        </div>

        <div className="mt-3 flex gap-1 border-t-2 border-foreground/10 pt-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.href}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 border-2 border-transparent px-2 py-1 text-[10px] font-black uppercase tracking-wide text-foreground/55 transition-all hover:border-foreground hover:bg-bauhaus-muted hover:text-foreground"
              title={action.label}
            >
              <action.icon className="h-3 w-3" aria-hidden />
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </Link>
  );
}
