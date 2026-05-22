import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { fadeUp, transitionFade } from '@/lib/motion/variants';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  message,
  action,
  className,
}: EmptyStateProps) {
  const reduced = usePrefersReducedMotion();

  const inner = (
    <>
      <m.div
        className="mb-4 rounded-full bg-primary-muted p-3"
        animate={reduced ? undefined : { y: [0, -3, 0] }}
        transition={reduced ? undefined : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon className="h-6 w-6 text-primary" aria-hidden />
      </m.div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </>
  );

  if (reduced) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
        <div className="mb-4 rounded-full bg-primary-muted p-3">
          <Icon className="h-6 w-6 text-primary" aria-hidden />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {message && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }

  return (
    <m.div
      className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      transition={transitionFade}
    >
      {inner}
    </m.div>
  );
}
