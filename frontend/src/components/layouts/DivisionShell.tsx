import { Link, Outlet } from 'react-router-dom';
import {
  Users,
  Swords,
  Trophy,
  TrendingUp,
  GitBranch,
  MapPin,
  LayoutDashboard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import PageContent from '@/components/shared/PageContent';
import { PageTransition } from '@/components/motion/PageTransition';
import { type PillNavItem } from '@/components/shared/PillNav';
import DivisionNav from '@/components/divisions/DivisionNav';
import DivisionHero from '@/components/divisions/DivisionHero';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { divisionThemeStyle, type DivisionTheme } from '@/lib/division-theme';
import type { Division } from '@/types';

export type DivisionNavItem = PillNavItem & { icon: LucideIcon };

interface DivisionShellProps {
  division: Division;
  tournamentSlug: string;
  divisionSlug: string;
  basePath: string;
  theme: DivisionTheme;
}

export function buildDivisionNavItems(basePath: string): DivisionNavItem[] {
  return [
    { label: 'Overview', href: basePath, icon: LayoutDashboard, end: true },
    { label: 'Teams', href: `${basePath}/teams`, icon: Users },
    { label: 'Matches', href: `${basePath}/matches`, icon: Swords },
    { label: 'Standings', href: `${basePath}/standings`, icon: Trophy },
    { label: 'Stats', href: `${basePath}/stats`, icon: TrendingUp },
    { label: 'Brackets', href: `${basePath}/brackets`, icon: GitBranch },
    { label: 'Venues', href: `${basePath}/venues`, icon: MapPin },
  ];
}

export function splitDivisionNavItems(items: DivisionNavItem[]) {
  // Mobile grid is grid-cols-5: 4 primary items + 1 "More" button = 5 cells exactly.
  return {
    primary: items.slice(0, 4),
    more: items.slice(4),
  };
}

export default function DivisionShell({
  division,
  basePath,
  theme,
}: DivisionShellProps) {
  const navItems = buildDivisionNavItems(basePath);
  const { primary: primaryNavItems, more: moreNavItems } = splitDivisionNavItems(navItems);
  const tournament = division.tournament;

  return (
    <div
      className="division-theme-root flex min-h-dvh min-h-screen w-full flex-col overflow-x-hidden bg-surface-muted"
      style={divisionThemeStyle(theme)}
    >
      <div
        className="h-0.5 w-full shrink-0"
        style={{ backgroundColor: theme.primary }}
        aria-hidden
      />

      {/* Hero header — breadcrumbs sit above the division title, no duplicate nav bar */}
      <header className="relative shrink-0 overflow-hidden border-b border-border bg-card">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundColor: `color-mix(in srgb, ${theme.accent} 12%, transparent)`,
          }}
          aria-hidden
        />

        {/* Breadcrumbs — above the hero title inside the card band */}
        <div className="page-container relative z-10 pt-3 pb-0">
          <Breadcrumb>
            <BreadcrumbList className="text-xs flex-nowrap">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/tournaments">Tournaments</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {tournament && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        to={`/tournaments/${tournament.slug}`}
                        className="max-w-[10rem] truncate sm:max-w-xs"
                        title={tournament.name}
                      >
                        {tournament.name}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate font-semibold">{division.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <DivisionHero division={division} theme={theme} />
      </header>

      {/* Sticky nav — tabs only, no repeated breadcrumbs */}
      <div className="sticky top-0 z-40 shrink-0 border-b border-border bg-card/95 shadow-sm backdrop-blur-sm">
        <div className="py-2">
          <DivisionNav
            primaryItems={primaryNavItems}
            moreItems={moreNavItems}
            allItems={navItems}
          />
        </div>
      </div>

      <main className="min-w-0 w-full flex-1">
        <PageContent className="-mt-2 md:-mt-3">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </PageContent>
      </main>
    </div>
  );
}
