import type { TeamOfficial } from '@/types';

interface TeamOfficialsListProps {
  officials: TeamOfficial[];
  teamColor?: string;
}

/** Read-only public display of a team's officials (manager, physio, etc.). */
export default function TeamOfficialsList({
  officials,
  teamColor = '#F48735',
}: TeamOfficialsListProps) {
  if (officials.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card px-6 py-6 text-center sm:px-10">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        {officials.map((official) => (
          <div key={official.id} className="min-w-0">
            <p
              className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ color: teamColor }}
            >
              {official.role}
            </p>
            <p className="text-sm font-bold uppercase tracking-wide text-foreground">
              {official.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
