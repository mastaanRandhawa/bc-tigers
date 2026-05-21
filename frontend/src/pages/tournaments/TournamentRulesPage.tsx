import Section from '@/components/shared/Section';
import SectionHeader from '@/components/shared/SectionHeader';
import { useTournamentRoute } from '@/context/TournamentContext';

export default function TournamentRulesPage() {
  const { tournament } = useTournamentRoute();

  return (
    <div className="space-y-5">
      <Section>
        <SectionHeader title="Tournament rules" />
        {tournament.rules ? (
          <div className="prose prose-sm max-w-none text-zinc-700 whitespace-pre-wrap">
            {tournament.rules}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Official rule book has not been published yet. Check back before the tournament begins.
          </p>
        )}
      </Section>
    </div>
  );
}
