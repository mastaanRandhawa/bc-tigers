import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import type { DivisionTheme } from '@/lib/division-theme';
import { cn } from '@/lib/utils';

export interface SegmentedNavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  end?: boolean;
}

interface SegmentedNavProps {
  items: SegmentedNavItem[];
  theme?: DivisionTheme;
  ariaLabel?: string;
  className?: string;
  glass?: boolean;
}

export default function SegmentedNav({
  items,
  theme,
  ariaLabel = 'Section navigation',
  className,
}: SegmentedNavProps) {
  const trackStyle = theme
    ? { backgroundColor: `color-mix(in srgb, ${theme.accent} 70%, white)` }
    : undefined;

  return (
    <nav aria-label={ariaLabel} className={cn('page-container', className)}>
      <div className="segmented-nav-track" style={trackStyle}>
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end ?? false}
            title={item.label}
            className={({ isActive }) =>
              cn(
                'segmented-nav-item',
                theme
                  ? cn('division-nav-pill', isActive && 'division-nav-pill-active')
                  : cn(isActive && 'segmented-nav-item-active'),
              )
            }
          >
            {({ isActive }) => (
              <>
                {item.icon && (
                  <item.icon
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden
                    style={theme && isActive ? { color: 'inherit' } : undefined}
                  />
                )}
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
