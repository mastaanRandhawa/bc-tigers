import Section from '@/components/shared/Section';
import SectionHeader from '@/components/shared/SectionHeader';
import { useTeamRoute } from '@/context/TeamContext';

export default function TeamStatsPage() {
  const { team } = useTeamRoute();
  const roster = team.rosters ?? [];

  return (
    <Section>
      <SectionHeader title="Team statistics" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-primary">{roster.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Squad size</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-zinc-500">
        Detailed player statistics are available on individual player profiles from the roster.
      </p>
    </Section>
  );
}
