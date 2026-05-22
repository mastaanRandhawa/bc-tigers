import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LayoutReveal } from '@/components/motion/LayoutReveal';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export interface PillNavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  end?: boolean;
}

type PillNavVariant = 'default' | 'light' | 'dark' | 'division';
type PillNavLayout = 'scroll' | 'grid';

interface PillNavProps {
  items: PillNavItem[];
  ariaLabel?: string;
  className?: string;
  variant?: PillNavVariant;
  layout?: PillNavLayout;
  columns?: number;
}

const containerClass: Record<PillNavVariant, string> = {
  default: 'flex gap-0.5 overflow-x-auto rounded-md border border-border/60 bg-secondary/80 p-0.5 no-scrollbar snap-x snap-mandatory',
  light: 'flex gap-0.5 overflow-x-auto no-scrollbar',
  dark: 'flex gap-0.5 overflow-x-auto rounded-md border border-border/60 bg-secondary/80 p-0.5 no-scrollbar snap-x snap-mandatory',
  division: 'flex gap-0.5 overflow-x-auto rounded-md border border-border/60 bg-secondary/80 p-0.5 no-scrollbar snap-x snap-mandatory',
};

function itemClass(variant: PillNavVariant, isActive: boolean): string {
  const base =
    'relative inline-flex shrink-0 snap-start items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-[var(--motion-normal)] whitespace-nowrap z-[1]';

  if (variant === 'light') {
    return cn(
      base,
      isActive
        ? 'text-white font-semibold after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-sm after:bg-white after:content-[""]'
        : 'text-white/80 hover:text-white hover:bg-white/10',
    );
  }

  if (variant === 'division') {
    return cn(base, isActive ? 'division-nav-pill-active' : 'division-nav-pill');
  }

  return cn(
    base,
    isActive ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground',
  );
}

const layoutIdByVariant: Partial<Record<PillNavVariant, string>> = {
  default: 'pill-nav-default',
  dark: 'pill-nav-dark',
  light: 'pill-nav-light',
};

export default function PillNav({
  items,
  ariaLabel = 'Section navigation',
  className,
  variant = 'default',
  layout = 'scroll',
  columns,
}: PillNavProps) {
  const reduced = usePrefersReducedMotion();
  const layoutId = layoutIdByVariant[variant];
  const pillBg =
    variant === 'light' || variant === 'division'
      ? undefined
      : 'bg-card shadow-sm';

  const wrapperClass =
    layout === 'grid'
      ? cn('grid rounded-xl bg-secondary p-1 gap-1', columns ? `grid-cols-${columns}` : 'grid-cols-auto', className)
      : cn(containerClass[variant], className);

  return (
    <nav aria-label={ariaLabel} className="page-container">
      <div className={wrapperClass}>
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end ?? false}
            title={item.label}
            className={({ isActive }) =>
              cn(itemClass(variant, isActive), layout === 'grid' && 'justify-center w-full')
            }
          >
            {({ isActive }) => (
              <>
                {isActive && layoutId && pillBg && !reduced && (
                  <LayoutReveal layoutId={layoutId} className={pillBg} />
                )}
                {item.icon && <item.icon className="h-3.5 w-3.5 shrink-0 relative z-[1]" aria-hidden />}
                <span className={cn('relative z-[1]', item.icon && 'hidden sm:inline')}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
