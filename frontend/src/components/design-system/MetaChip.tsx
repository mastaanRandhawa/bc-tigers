import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetaChipProps {
  icon?: LucideIcon;
  label?: string;
  value: string;
  variant?: 'default' | 'dark' | 'accent' | 'bauhaus-red' | 'bauhaus-blue' | 'bauhaus-yellow';
  className?: string;
}

export default function MetaChip({
  icon: Icon,
  label,
  value,
  variant = 'default',
  className,
}: MetaChipProps) {
  const styles = {
    default: 'bg-white text-foreground border-foreground shadow-hard-sm',
    dark: 'bg-white/10 text-white border-white/40 backdrop-blur-sm',
    accent: 'bg-primary text-white border-foreground shadow-hard-sm',
    'bauhaus-red': 'bg-bauhaus-red text-white border-foreground shadow-hard-sm',
    'bauhaus-blue': 'bg-bauhaus-blue text-white border-foreground shadow-hard-sm',
    'bauhaus-yellow': 'bg-bauhaus-yellow text-foreground border-foreground shadow-hard-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border-2 px-2.5 py-1 text-xs font-bold uppercase tracking-wide',
        styles[variant],
        className,
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      {label && <span className="text-[10px] tracking-widest opacity-70">{label}</span>}
      <span className="truncate normal-case tracking-normal font-semibold">{value}</span>
    </span>
  );
}
