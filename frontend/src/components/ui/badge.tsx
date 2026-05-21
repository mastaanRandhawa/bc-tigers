import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center border-2 border-foreground px-2 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary-muted text-foreground',
        accent: 'bg-primary text-white border-primary',
        secondary: 'bg-bauhaus-muted text-foreground',
        destructive: 'bg-bauhaus-red text-white border-bauhaus-red',
        outline: 'border-foreground text-foreground bg-white',
        live: 'bg-bauhaus-red text-white border-bauhaus-red animate-live-pulse',
        success: 'bg-emerald-500 text-white border-emerald-700',
        warning: 'bg-bauhaus-yellow text-foreground border-foreground',
        scheduled: 'bg-white text-foreground',
        cancelled: 'bg-bauhaus-muted text-foreground/50 line-through',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
