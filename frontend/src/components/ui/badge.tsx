import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary-muted text-primary border border-primary/20',
        accent: 'bg-primary text-white',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-red-50 text-red-700 border border-red-200',
        outline: 'border border-border text-foreground bg-white',
        live: 'bg-red-600 text-white animate-pulse',
        success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        warning: 'bg-amber-50 text-amber-800 border border-amber-200',
        scheduled: 'bg-zinc-100 text-zinc-700 border border-border',
        cancelled: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
