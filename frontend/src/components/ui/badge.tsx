import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary-muted text-primary-hover border border-primary/30',
        accent: 'bg-primary text-white',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-red-100 text-red-800',
        outline: 'border border-border text-foreground bg-white',
        live: 'bg-red-600 text-white animate-pulse',
        success: 'bg-green-700 text-white',
        warning: 'bg-amber-600 text-white',
        scheduled: 'bg-primary text-white',
        cancelled: 'bg-gray-600 text-white',
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
