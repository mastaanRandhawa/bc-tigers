import DivisionPageHeader from '@/components/divisions/DivisionPageHeader';
import { BarChart3 } from 'lucide-react';

export default function DivisionStatsPage() {
  return (
    <>
      <DivisionPageHeader title="Statistics" subtitle="Player leaders and discipline" />
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/40" aria-hidden />
        <p className="text-sm font-medium text-foreground">Statistics coming soon</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Player stats and leaderboards are not available for this division yet.
        </p>
      </div>
    </>
  );
}
