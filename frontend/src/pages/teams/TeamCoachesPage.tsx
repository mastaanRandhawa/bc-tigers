import { UserCircle } from 'lucide-react';
import Section from '@/components/shared/Section';
import SectionHeader from '@/components/shared/SectionHeader';
import { useTeamRoute } from '@/context/TeamContext';

export default function TeamCoachesPage() {
  const { team } = useTeamRoute();
  const coaches = team.team_coaches ?? [];

  return (
    <Section>
      <SectionHeader title="Coaching staff" />
      {coaches.length > 0 ? (
        <div className="space-y-3">
          {coaches.map((tc) => {
            const coach = tc.coach;
            if (!coach) return null;
            return (
              <div
                key={tc.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-white p-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-muted">
                  <UserCircle className="h-6 w-6 text-primary" aria-hidden />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {coach.first_name} {coach.last_name}
                  </p>
                  {tc.role && (
                    <p className="text-sm text-zinc-500">{tc.role}</p>
                  )}
                  {coach.email && (
                    <p className="text-xs text-zinc-400 mt-0.5">{coach.email}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No coaches assigned to this team yet.</p>
      )}
    </Section>
  );
}
