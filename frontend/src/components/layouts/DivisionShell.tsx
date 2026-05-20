import { Link, Outlet } from 'react-router-dom';
import {
  Users,
  Calendar,
  Swords,
  Trophy,
  TrendingUp,
  GitBranch,
  MapPin,
  LayoutDashboard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import LiveScoreTicker from '@/components/LiveScoreTicker';
import PageContent from '@/components/shared/PageContent';
import PillNav, { type PillNavItem } from '@/components/shared/PillNav';
import DivisionHero from '@/components/divisions/DivisionHero';
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
    { label: 'Schedule', href: `${basePath}/schedule`, icon: Calendar },
    { label: 'Matches', href: `${basePath}/matches`, icon: Swords },
    { label: 'Standings', href: `${basePath}/standings`, icon: Trophy },
    { label: 'Stats', href: `${basePath}/stats`, icon: TrendingUp },
    { label: 'Brackets', href: `${basePath}/brackets`, icon: GitBranch },
    { label: 'Venues', href: `${basePath}/venues`, icon: MapPin },
  ];
}

export default function DivisionShell({
  division,
  basePath,
  theme,
}: DivisionShellProps) {
  const navItems = buildDivisionNavItems(basePath);

  return (
    <div
      className="division-theme-root flex min-h-dvh min-h-screen w-full flex-col overflow-x-hidden bg-zinc-50"
      style={divisionThemeStyle(theme)}
    >
      <div
        className="h-0.5 w-full shrink-0"
        style={{ backgroundColor: theme.primary }}
        aria-hidden
      />

      <header className="relative shrink-0 overflow-hidden border-b border-border bg-white">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(180deg, color-mix(in srgb, ${theme.accent} 45%, white) 0%, white 100%)`,
          }}
          aria-hidden
        />

        <div className="page-container relative z-10 border-b border-border/50 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" className="inline-flex shrink-0 items-center gap-1">
              <div className="rounded-md bg-zinc-900 px-2 py-0.5 text-xs font-bold tracking-tight text-white">
                BC
              </div>
              <div
                className="rounded-md px-2 py-0.5 text-xs font-bold"
                style={{
                  backgroundColor: theme.accent,
                  color: theme.primary,
                  border: `1px solid color-mix(in srgb, ${theme.primary} 20%, transparent)`,
                }}
              >
                TIGERS
              </div>
            </Link>
            <div className="min-w-0 flex-1 border-l border-border pl-3">
              <LiveScoreTicker embedded alwaysShow divisionId={division.id} variant="light" />
            </div>
          </div>
        </div>

        <DivisionHero division={division} theme={theme} />
      </header>

      <div className="sticky top-0 z-40 shrink-0 border-b border-border bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="py-2">
          <PillNav items={navItems} theme={theme} ariaLabel="Division navigation" />
        </div>
      </div>

      <main className="min-w-0 w-full flex-1">
        <PageContent className="-mt-2 md:-mt-3">
          <Outlet />
        </PageContent>
      </main>
    </div>
  );
}
