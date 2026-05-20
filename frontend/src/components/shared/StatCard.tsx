import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: LucideIcon;
  trend?: string;
  accent?: boolean;
  className?: string;
}

export default function StatCard({
  value,
  label,
  icon: Icon,
  trend,
  accent = false,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-px',
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            accent ? 'bg-primary-muted text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-2xl font-bold tracking-tight font-display leading-none',
            accent ? 'text-primary' : 'text-foreground',
          )}
        >
          {value}
        </p>
        <p className="text-xs text-zinc-500 mt-1 font-medium">{label}</p>
        {trend && <p className="text-[11px] text-zinc-400 mt-0.5">{trend}</p>}
      </div>
    </div>
  );
}
