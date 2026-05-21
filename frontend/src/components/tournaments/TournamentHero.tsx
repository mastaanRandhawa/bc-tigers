import { Link } from 'react-router-dom';
import { Calendar, MapPin, Trophy, Radio, Users, Flag } from 'lucide-react';
import StatusBadge from '@/components/design-system/StatusBadge';
import MetaChip from '@/components/design-system/MetaChip';
import SurfaceCard from '@/components/design-system/SurfaceCard';
import { formatDate } from '@/lib/utils';
import type { Tournament } from '@/types';

interface TournamentHeroProps {
  tournament: Tournament;
  liveMatchCount?: number;
}

export default function TournamentHero({ tournament, liveMatchCount = 0 }: TournamentHeroProps) {
  const typeLabel = tournament.tournament_type.replace(/_/g, ' ');
  const divisionCount = tournament.divisions?.length ?? 0;
  const teamCount =
    tournament.divisions?.reduce((sum, d) => sum + (d.teams?.length ?? 0), 0) ?? 0;

  return (
    <div className="relative overflow-hidden bg-tournament-hero text-white">
      <div className="pointer-events-none absolute inset-0 bg-hero-mesh opacity-95" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-40" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
        aria-hidden
      />

      {/* Geometric accents */}
      <div
        className="bauhaus-accent-circle pointer-events-none absolute -right-12 top-8 h-40 w-40 border-white/20"
        aria-hidden
      />
      <div
        className="bauhaus-accent-square pointer-events-none absolute -left-6 bottom-12 h-20 w-20 rotate-45 border-bauhaus-yellow/40 bg-bauhaus-yellow/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[20%] top-0 h-full w-px bg-white/10"
        aria-hidden
      />

      <div className="page-container relative z-10 py-6 sm:py-8 lg:py-10">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Link
            to="/tournaments"
            className="inline-flex items-center gap-1 border-2 border-white/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white/80 transition-all hover:border-white hover:bg-white hover:text-foreground"
          >
            ← All tournaments
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            {tournament.logo ? (
              <div className="relative shrink-0">
                <div
                  className="absolute -inset-1 border-2 border-white/30 bg-white/10"
                  aria-hidden
                />
                <img
                  src={tournament.logo}
                  alt=""
                  className="relative h-16 w-16 border-2 border-white object-cover sm:h-20 sm:w-20"
                />
              </div>
            ) : (
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center border-2 border-white bg-white/10 sm:h-20 sm:w-20"
                aria-hidden
              >
                <Trophy className="h-8 w-8 text-white sm:h-10 sm:w-10" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={tournament.status} />
                {liveMatchCount > 0 && (
                  <MetaChip
                    icon={Radio}
                    value={`${liveMatchCount} live`}
                    variant="bauhaus-red"
                    className="animate-live-pulse"
                  />
                )}
              </div>
              <h1 className="text-hero-title m-0 text-white">{tournament.name}</h1>
              <div className="mt-4 flex flex-wrap gap-2">
                <MetaChip
                  icon={Calendar}
                  value={`${formatDate(tournament.start_date)} – ${formatDate(tournament.end_date)}`}
                  variant="dark"
                />
                {tournament.location && (
                  <MetaChip icon={MapPin} value={tournament.location} variant="dark" />
                )}
                <MetaChip icon={Trophy} value={typeLabel} variant="dark" />
              </div>
            </div>
          </div>

          {/* Floating stat cards */}
          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
            <SurfaceCard variant="glass" padding="sm" className="min-w-[7rem] border-white/40 bg-black/30 text-white shadow-hard-brand">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 shrink-0 text-bauhaus-yellow" aria-hidden />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60 m-0">Divisions</p>
                  <p className="text-2xl font-black tabular-nums m-0">{divisionCount}</p>
                </div>
              </div>
            </SurfaceCard>
            {teamCount > 0 && (
              <SurfaceCard variant="glass" padding="sm" className="min-w-[7rem] border-white/40 bg-black/30 text-white shadow-hard-brand">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60 m-0">Teams</p>
                    <p className="text-2xl font-black tabular-nums m-0">{teamCount}</p>
                  </div>
                </div>
              </SurfaceCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
