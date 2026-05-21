import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Flag, Image, Newspaper, BookOpen, Radio, Users } from 'lucide-react';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useListSearch } from '@/hooks/useListSearch';
import { divisionSearchText } from '@/lib/search-text';
import MatchCard from '@/components/MatchCard';
import SectionBlock from '@/components/design-system/SectionBlock';
import SurfaceCard from '@/components/design-system/SurfaceCard';
import MetaChip from '@/components/design-system/MetaChip';
import StatBlock from '@/components/design-system/StatBlock';
import EmptyStatePanel from '@/components/design-system/EmptyStatePanel';
import DivisionCard from '@/components/tournaments/DivisionCard';
import { useTournamentRoute } from '@/context/TournamentContext';
import { useMatches } from '@/hooks/useMatches';
import { useTournamentMatches } from '@/hooks/useTournamentResources';
import {
  tournamentDivisionsPath,
  tournamentMediaPath,
  tournamentNewsPath,
  tournamentRulesPath,
} from '@/lib/tournament-routes';
import { divisionMatchPath } from '@/lib/division-routes';
import { formatDate } from '@/lib/utils';

export default function TournamentOverviewPage() {
  const { tournament, tournamentSlug } = useTournamentRoute();
  const { data: matches = [] } = useMatches({ tournamentId: tournament.id });
  const { data: resourceMatches = [] } = useTournamentMatches(tournamentSlug, { limit: 20 });

  const allMatches = resourceMatches.length > 0 ? resourceMatches : matches;
  const liveMatches = allMatches.filter((m) => m.status === 'LIVE');
  const upcomingMatches = allMatches
    .filter((m) => m.status === 'SCHEDULED')
    .slice(0, 4);
  const divisions = tournament.divisions ?? [];
  const teamCount = divisions.reduce((sum, d) => sum + (d.teams?.length ?? 0), 0);

  const getDivisionText = useCallback((d: (typeof divisions)[0]) => divisionSearchText(d), []);
  const {
    search: divisionSearch,
    setSearch: setDivisionSearch,
    filtered: filteredDivisions,
    debouncedSearch: debouncedDivisionSearch,
    hasQuery: hasDivisionQuery,
  } = useListSearch(divisions, getDivisionText);

  const quickLinks = [
    { label: 'Media', href: tournamentMediaPath(tournamentSlug), icon: Image },
    { label: 'News', href: tournamentNewsPath(tournamentSlug), icon: Newspaper },
    { label: 'Rules', href: tournamentRulesPath(tournamentSlug), icon: BookOpen },
  ];

  return (
    <div className="space-y-4">
      <SurfaceCard variant="glass" padding="md" className="flex flex-wrap gap-3">
        <MetaChip icon={Flag} value={`${divisions.length} divisions`} />
        {teamCount > 0 && <MetaChip icon={Users} value={`${teamCount} teams`} />}
        {liveMatches.length > 0 && (
          <MetaChip icon={Radio} value={`${liveMatches.length} live now`} variant="bauhaus-red" />
        )}
        <MetaChip
          value={`${formatDate(tournament.start_date)} – ${formatDate(tournament.end_date)}`}
        />
      </SurfaceCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {tournament.description && (
          <SectionBlock title="About" variant="card" className="lg:col-span-2">
            <p className="text-body m-0 leading-relaxed normal-case">{tournament.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <StatBlock label="Divisions" value={divisions.length} accent="brand" icon={Flag} />
              {teamCount > 0 && (
                <StatBlock label="Teams" value={teamCount} accent="blue" icon={Users} />
              )}
              <StatBlock
                label="Status"
                value={tournament.status.replace(/_/g, ' ')}
                accent="yellow"
              />
            </div>
          </SectionBlock>
        )}

        {liveMatches.length > 0 ? (
          <SectionBlock title="Live now" variant="card" className={tournament.description ? '' : 'lg:col-span-3'}>
            <MatchCard match={liveMatches[0]} featured />
          </SectionBlock>
        ) : (
          <SectionBlock title="Live now" variant="card" className={tournament.description ? '' : 'lg:col-span-3'}>
            <EmptyStatePanel
              icon={Radio}
              title="No live matches"
              description="Check back during match days for live scores and updates."
              className="py-8 shadow-none border-0"
            />
          </SectionBlock>
        )}
      </div>

      <SectionBlock
        title="Divisions"
        subtitle={`${divisions.length} competition${divisions.length === 1 ? '' : 's'}`}
        href={tournamentDivisionsPath(tournamentSlug)}
        variant="flat"
      >
        {divisions.length > 3 && (
          <SearchField
            value={divisionSearch}
            onChange={setDivisionSearch}
            placeholder="Search divisions…"
            className="mb-3 max-w-md"
          />
        )}
        {hasDivisionQuery && filteredDivisions.length === 0 ? (
          <SearchEmpty query={debouncedDivisionSearch} entityLabel="divisions" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredDivisions.slice(0, 4).map((div) => (
              <DivisionCard
                key={div.id}
                division={{ ...div, tournament }}
                tournamentSlug={tournamentSlug}
                variant="grid"
              />
            ))}
          </div>
        )}
      </SectionBlock>

      {upcomingMatches.length > 0 ? (
        <SectionBlock title="Upcoming matches" variant="card">
          <div className="space-y-2">
            {upcomingMatches.map((m) => {
              const divisionSlug = m.division?.slug;
              const matchHref = divisionSlug
                ? divisionMatchPath(tournamentSlug, divisionSlug, m.id)
                : undefined;
              return matchHref ? (
                <Link key={m.id} to={matchHref} className="block">
                  <MatchCard match={m} flat />
                </Link>
              ) : (
                <MatchCard key={m.id} match={m} flat />
              );
            })}
          </div>
        </SectionBlock>
      ) : (
        <SectionBlock title="Upcoming matches" variant="card">
          <EmptyStatePanel
            title="No upcoming matches"
            description="The schedule will appear here once matches are published."
            className="py-8"
          />
        </SectionBlock>
      )}

      <div className="flex flex-wrap gap-2">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="inline-flex items-center gap-1.5 border-2 border-foreground bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-foreground shadow-hard-sm transition-all duration-200 ease-out hover:shadow-hard-md hover:-translate-x-0.5 hover:-translate-y-0.5 hover:text-primary"
          >
            <link.icon className="h-3.5 w-3.5" aria-hidden />
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
