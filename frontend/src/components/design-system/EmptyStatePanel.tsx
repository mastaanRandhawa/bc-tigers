import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import SurfaceCard from '@/components/design-system/SurfaceCard';
import { cn } from '@/lib/utils';

interface EmptyStatePanelProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyStatePanel({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStatePanelProps) {
  return (
    <SurfaceCard
      variant="default"
      className={cn('relative flex flex-col items-center justify-center overflow-hidden py-12 text-center', className)}
    >
      <div
        className="bauhaus-accent-circle -right-8 -top-8 h-24 w-24 border-foreground/15"
        aria-hidden
      />
      <div
        className="bauhaus-accent-square -bottom-6 -left-6 h-16 w-16 rotate-12 border-foreground/10 bg-bauhaus-yellow/20"
        aria-hidden
      />
      {Icon && (
        <div className="relative mb-4 flex h-14 w-14 items-center justify-center border-2 border-foreground bg-bauhaus-muted shadow-hard-sm">
          <Icon className="h-7 w-7 text-foreground/50" aria-hidden />
        </div>
      )}
      <h3 className="relative m-0 text-sm font-black uppercase tracking-wider text-foreground">{title}</h3>
      {description && (
        <p className="text-meta relative mt-2 max-w-sm normal-case">{description}</p>
      )}
      {action && <div className="relative mt-5">{action}</div>}
    </SurfaceCard>
  );
}
