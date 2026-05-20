import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import type { DivisionTheme } from '@/lib/division-theme';
import PillNav from '@/components/shared/PillNav';
import { cn } from '@/lib/utils';
import type { DivisionNavItem } from '@/components/layouts/DivisionShell';

interface DivisionNavProps {
  primaryItems: DivisionNavItem[];
  moreItems: DivisionNavItem[];
  allItems: DivisionNavItem[];
  theme?: DivisionTheme;
}

function isNavActive(pathname: string, href: string, end?: boolean) {
  if (end) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DivisionNav({
  primaryItems,
  moreItems,
  allItems,
  theme,
}: DivisionNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const moreActive = moreItems.some((item) => isNavActive(pathname, item.href, item.end));

  const trackStyle = theme
    ? { backgroundColor: `color-mix(in srgb, ${theme.accent} 60%, #f4f4f5)` }
    : undefined;

  const linkClass = (isActive: boolean) =>
    cn(
      'inline-flex shrink-0 items-center justify-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-200 min-h-[2.25rem]',
      theme
        ? cn('division-nav-pill', isActive && 'division-nav-pill-active')
        : cn(
            'text-zinc-500 hover:bg-white/60 hover:text-foreground',
            isActive && 'bg-white font-semibold text-foreground shadow-sm',
          ),
    );

  return (
    <>
      <nav aria-label="Division navigation" className="page-container lg:hidden">
        <div
          className="grid grid-cols-5 gap-1 rounded-xl p-1"
          style={trackStyle}
        >
          {primaryItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end ?? false}
              className={({ isActive }) => cn(linkClass(isActive), 'w-full')}
            >
              {item.label}
            </NavLink>
          ))}

          {moreItems.length > 0 && (
            <div className="relative">
              <button
                type="button"
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                onClick={() => setMoreOpen((open) => !open)}
                className={cn(linkClass(moreActive), 'w-full')}
              >
                <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
                <span>More</span>
              </button>
              {moreOpen && (
                <>
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-border bg-white py-1 shadow-lg"
                  >
                    {moreItems.map((item) => (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-zinc-50',
                            isActive ? 'font-semibold' : 'text-zinc-600',
                          )
                        }
                        style={({ isActive }) =>
                          isActive && theme ? { color: theme.primary } : undefined
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

      <div className="hidden lg:block">
        <PillNav items={allItems} theme={theme} ariaLabel="Division navigation" />
      </div>
    </>
  );
}
