import type { LucideIcon } from 'lucide-react';
import MetricCard from '@/components/shared/MetricCard';

interface AdminStatItem {
  value: string | number;
  label: string;
  icon?: LucideIcon;
  accent?: boolean;
}

interface AdminStatGridProps {
  items: AdminStatItem[];
  className?: string;
}

function getMobileGridCols(count: number): string {
  if (count === 2) return 'grid-cols-2';
  if (count >= 4) return 'grid-cols-2 sm:grid-cols-4';
  return 'grid-cols-2 sm:grid-cols-3';
}

export default function AdminStatGrid({ items, className }: AdminStatGridProps) {
  return (
    <div className={`grid ${getMobileGridCols(items.length)} gap-2.5 sm:gap-3 ${className ?? ''}`}>
      {items.map((item) => (
        <MetricCard
          key={item.label}
          value={item.value}
          label={item.label}
          icon={item.icon}
          accent={item.accent}
        />
      ))}
    </div>
  );
}
