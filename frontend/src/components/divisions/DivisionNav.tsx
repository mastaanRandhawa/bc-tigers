import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import PillNav from '@/components/shared/PillNav';
import { cn } from '@/lib/utils';
import type { DivisionNavItem } from '@/components/layouts/DivisionShell';

interface DivisionNavProps {
  primaryItems: DivisionNavItem[];
  moreItems: DivisionNavItem[];
  allItems: DivisionNavItem[];
}

function isNavActive(pathname: string, href: string, end?: boolean) {
  if (end) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DivisionNav({
  primaryItems,
  moreItems,
  allItems,
}: DivisionNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const moreActive = moreItems.some((item) => isNavActive(pathname, item.href, item.end));

  const linkClass = (isActive: boolean) =>
    cn(
      'inline-flex shrink-0 items-center justify-center gap-1 rounded-md px-2.5 py-2 text-xs font-medium transition-all duration-200 min-h-[2.25rem]',
      isActive
        ? 'bg-card text-foreground font-semibold shadow-sm'
        : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
    );

  return (
    <>
      <nav aria-label="Division navigation" className="page-container lg:hidden">
        <div className="grid grid-cols-5 gap-1 rounded-xl bg-secondary p-1">
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
                    className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-lg"
                  >
                    {moreItems.map((item) => (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        role="menuitem"
                        onClick={() => setMoreOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-secondary',
                            isActive ? 'font-semibold text-foreground' : 'text-muted-foreground',
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

      <div className="hidden lg:block">
        <PillNav items={allItems} ariaLabel="Division navigation" />
      </div>
    </>
  );
}
