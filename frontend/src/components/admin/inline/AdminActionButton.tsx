import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

interface AdminActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'xs';
}

/**
 * A consistently styled button for inline admin actions.
 * Uses subtle chrome so it doesn't compete with public CTAs.
 */
export function AdminActionButton({
  variant = 'outline',
  size = 'sm',
  className,
  children,
  ...props
}: AdminActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
        size === 'sm' && 'px-2.5 py-1.5 text-xs',
        size === 'xs' && 'px-1.5 py-1 text-[11px]',
        variant === 'outline' &&
          'border border-border bg-card text-foreground hover:bg-muted',
        variant === 'ghost' &&
          'text-muted-foreground hover:bg-secondary hover:text-foreground',
        variant === 'destructive' &&
          'border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800/60 dark:hover:bg-red-950/30',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
