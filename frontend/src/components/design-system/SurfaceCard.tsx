import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SurfaceVariant = 'default' | 'elevated' | 'interactive' | 'glass' | 'dark';

interface SurfaceCardProps {
  children: ReactNode;
  className?: string;
  id?: string;
  variant?: SurfaceVariant;
  accentEdge?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'section' | 'article';
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-3.5 md:p-4',
  lg: 'p-4 md:p-5',
};

const variantMap: Record<SurfaceVariant, string> = {
  default: 'ds-surface',
  elevated: 'bg-white border-2 border-foreground md:border-4 shadow-hard-md',
  interactive: 'ds-surface-interactive press-scale',
  glass: 'bg-white/90 backdrop-blur-md border-2 border-foreground shadow-hard-sm',
  dark: 'bg-foreground text-white border-2 border-foreground shadow-hard-brand',
};

export default function SurfaceCard({
  children,
  className,
  id,
  variant = 'default',
  accentEdge = false,
  padding = 'md',
  as: Tag = 'div',
}: SurfaceCardProps) {
  return (
    <Tag
      id={id}
      className={cn(
        variantMap[variant],
        paddingMap[padding],
        accentEdge && 'border-l-4 border-l-primary pl-[calc(0.875rem+2px)] md:pl-[calc(1rem+2px)]',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
