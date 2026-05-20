import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import type { DivisionTheme } from '@/lib/division-theme';
import { cn } from '@/lib/utils';

export interface PillNavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  end?: boolean;
}

interface PillNavProps {
  items: PillNavItem[];
  /** Division accent for active tab; omit for neutral (portals). */
  theme?: DivisionTheme;
  ariaLabel?: string;
  className?: string;
}

export default function PillNav({ items, theme, ariaLabel = 'Section navigation', className }: PillNavProps) {
  const trackStyle = theme
    ? { backgroundColor: `color-mix(in srgb, ${theme.accent} 60%, #f4f4f5)` }
    : undefined;

  return (
    <nav aria-label={ariaLabel} className={cn('page-container', className)}>
      <div
        className="flex gap-1 overflow-x-auto rounded-xl p-1 no-scrollbar snap-x snap-mandatory"
        style={trackStyle}
      >
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end ?? false}
            title={item.label}
            className={({ isActive }) =>
              cn(
                'inline-flex shrink-0 snap-start items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200',
                theme
                  ? cn('division-nav-pill', isActive && 'division-nav-pill-active')
                  : cn(
                      'font-medium text-zinc-500 hover:text-foreground hover:bg-white/60',
                      isActive && 'bg-white font-semibold text-foreground shadow-sm',
                    ),
              )
            }
          >
            {({ isActive }) => (
              <>
                {item.icon && (
                  <item.icon
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden
                    style={
                      theme && isActive ? { color: theme.primary } : undefined
                    }
                  />
                )}
                <span className="hidden sm:inline">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
