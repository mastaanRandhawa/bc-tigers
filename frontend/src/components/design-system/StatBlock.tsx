import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatBlockProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  accent?: 'brand' | 'red' | 'blue' | 'yellow' | 'default';
  className?: string;
}

const accentMap = {
  brand: 'border-l-primary bg-primary-muted/40',
  red: 'border-l-bauhaus-red bg-bauhaus-red/10',
  blue: 'border-l-bauhaus-blue bg-bauhaus-blue/10',
  yellow: 'border-l-bauhaus-yellow bg-bauhaus-yellow/20',
  default: 'border-l-foreground bg-bauhaus-muted/50',
};

export default function StatBlock({
  icon: Icon,
  label,
  value,
  accent = 'default',
  className,
}: StatBlockProps) {
  return (
    <div
      className={cn(
        'border-2 border-foreground border-l-4 bg-white p-3 shadow-hard-sm',
        accentMap[accent],
        className,
      )}
    >
      <div className="flex items-start gap-2">
        {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground/50" aria-hidden />}
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50 m-0">{label}</p>
          <p className="text-xl font-black tabular-nums tracking-tight text-foreground m-0 mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}
