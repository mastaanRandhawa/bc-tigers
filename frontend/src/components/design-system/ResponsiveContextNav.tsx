import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import SegmentedNav, { type SegmentedNavItem } from '@/components/design-system/SegmentedNav';
import { isContextNavActive } from '@/lib/context-nav';
import type { DivisionTheme } from '@/lib/division-theme';
import { cn } from '@/lib/utils';

interface ResponsiveContextNavProps {
  items: SegmentedNavItem[];
  primaryCount?: number;
  theme?: DivisionTheme;
  ariaLabel?: string;
  sticky?: boolean;
}

export default function ResponsiveContextNav({
  items,
  primaryCount = 5,
  theme,
  ariaLabel = 'Navigation',
  sticky = false,
}: ResponsiveContextNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const primary = items.slice(0, primaryCount);
  const more = items.slice(primaryCount);
  const moreActive = more.some((item) => isContextNavActive(pathname, item.href, item.end));
  const colCount = more.length > 0 ? primaryCount + 1 : primary.length;

  const linkClass = (isActive: boolean) =>
    cn(
      'inline-flex shrink-0 items-center justify-center gap-0.5 px-1.5 py-2 text-[10px] font-bold uppercase tracking-wide transition-all duration-200 min-h-[2.5rem]',
      theme
        ? cn('division-nav-pill', isActive && 'division-nav-pill-active')
        : cn(
            'text-foreground/55 hover:bg-bauhaus-muted/60 hover:text-foreground',
            isActive && 'bg-foreground font-black text-white shadow-hard-sm',
          ),
    );

  const trackStyle = theme
    ? { backgroundColor: `color-mix(in srgb, ${theme.accent} 70%, white)` }
    : undefined;

  const stickyClass = sticky
    ? 'sticky top-0 z-40 border-b-2 border-foreground bg-surface-0/95 backdrop-blur-md'
    : '';

  return (
    <div className={stickyClass}>
      <nav aria-label={ariaLabel} className="page-container lg:hidden">
        <div
          className="segmented-nav-track grid gap-0 p-0.5"
          style={{
            ...trackStyle,
            gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
          }}
        >
          {primary.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end ?? false}
              className={({ isActive }) => cn(linkClass(isActive), 'w-full flex-col border-0')}
            >
              {item.icon && <item.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
              <span className="truncate leading-tight">{item.label}</span>
            </NavLink>
          ))}

          {more.length > 0 && (
            <div className="relative">
              <button
                type="button"
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                onClick={() => setMoreOpen((o) => !o)}
                className={cn(linkClass(moreActive), 'w-full flex-col border-0')}
              >
                <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
                <span>More</span>
              </button>
              {moreOpen && (
                <>
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] overflow-hidden border-2 border-foreground bg-white py-1 shadow-hard-md"
                  >
                    {more.map((item) => (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2 px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors hover:bg-bauhaus-muted',
                            isActive
                              ? theme
                                ? 'font-black division-link'
                                : 'font-black text-primary'
                              : 'text-foreground/65',
                          )
                        }
                      >
                        {item.icon && <item.icon className="h-4 w-4 shrink-0" aria-hidden />}
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Close menu"
                    onClick={() => setMoreOpen(false)}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      <div className="hidden lg:block py-1">
        <SegmentedNav items={items} theme={theme} ariaLabel={ariaLabel} />
      </div>
    </div>
  );
}
