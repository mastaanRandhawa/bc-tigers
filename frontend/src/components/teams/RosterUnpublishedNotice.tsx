import Section from '@/components/shared/Section';
import SectionHeader from '@/components/shared/SectionHeader';
import { formatDateTime } from '@/lib/utils';
import { Users } from 'lucide-react';

interface RosterUnpublishedNoticeProps {
  rostersAvailableAt?: string | null;
}

export default function RosterUnpublishedNotice({
  rostersAvailableAt,
}: RosterUnpublishedNoticeProps) {
  return (
    <Section>
      <SectionHeader title="Roster" />
      <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-6 py-10 text-center">
        <Users className="h-10 w-10 text-muted-foreground/40" aria-hidden />
        <p className="text-sm font-medium text-foreground">
          Rosters will be published after registration closes
        </p>
        <p className="max-w-md text-xs text-muted-foreground">
          {rostersAvailableAt
            ? `Team rosters will be available on ${formatDateTime(rostersAvailableAt)}.`
            : 'Check back once team registration is finalized.'}
        </p>
      </div>
    </Section>
  );
}
