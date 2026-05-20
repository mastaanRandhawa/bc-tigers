import type { LucideIcon } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';

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

export default function AdminStatGrid({ items, className }: AdminStatGridProps) {
  return (
    <div className={`grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3 ${className ?? ''}`}>
      {items.map((item) => (
        <StatCard
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
