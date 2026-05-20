import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Users,
  UserCircle,
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
import DivisionHero from '@/components/divisions/DivisionHero';
import { divisionThemeStyle, type DivisionTheme } from '@/lib/division-theme';
import type { Division } from '@/types';
import { cn } from '@/lib/utils';

export interface DivisionNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  end?: boolean;
}

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
    { label: 'Players', href: `${basePath}/players`, icon: UserCircle },
    { label: 'Schedule', href: `${basePath}/schedule`, icon: Calendar },
    { label: 'Matches', href: `${basePath}/matches`, icon: Swords },
    { label: 'Standings', href: `${basePath}/standings`, icon: Trophy },
    { label: 'Stats', href: `${basePath}/stats`, icon: TrendingUp },
    { label: 'Brackets', href: `${basePath}/brackets`, icon: GitBranch },
    { label: 'Venues', href: `${basePath}/venues`, icon: MapPin },
  ];
}

function DivisionNavbar({ items }: { items: DivisionNavItem[] }) {
  return (
    <nav
      aria-label="Division navigation"
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 safe-x"
    >
      <div className="flex gap-1 overflow-x-auto no-scrollbar py-2 snap-x snap-mandatory bg-zinc-100/80 rounded-xl px-1">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end ?? false}
            title={item.label}
            aria-label={item.label}
            className={({ isActive }) =>
              cn(
                'division-nav-pill inline-flex items-center gap-1.5 shrink-0 snap-start',
                isActive && 'division-nav-pill-active',
              )
            }
          >
            <item.icon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function DivisionShell({
  division,
  basePath,
  theme,
}: DivisionShellProps) {
  const navItems = buildDivisionNavItems(basePath);

  return (
    <div
      className="min-h-dvh min-h-screen flex flex-col w-full overflow-x-hidden division-theme-root bg-surface-muted"
      style={divisionThemeStyle(theme)}
    >
      <header className="relative bg-hero-gradient border-b border-border shrink-0 overflow-hidden">
        <div className="absolute inset-0 bg-brand-grid pointer-events-none opacity-60" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/60" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2 safe-x">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
            <Link to="/" className="inline-flex items-center gap-1 shrink-0">
              <div className="font-bold tracking-tight text-xs px-2 py-0.5 rounded-lg bg-foreground text-white">
                BC
              </div>
              <div className="font-bold text-xs px-2 py-0.5 rounded-lg bg-primary-muted text-primary border border-primary/20">
                TIGERS
              </div>
            </Link>

            <div className="flex-1 min-w-0 sm:border-l sm:border-border sm:pl-4">
              <LiveScoreTicker embedded alwaysShow divisionId={division.id} variant="light" />
            </div>
          </div>
        </div>

        <DivisionHero division={division} />
      </header>

      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm shrink-0">
        <div className="py-2">
          <DivisionNavbar items={navItems} />
        </div>
      </div>

      <main className="flex-1 w-full min-w-0">
        <PageContent className="-mt-2 md:-mt-3">
          <Outlet />
        </PageContent>
      </main>
    </div>
  );
}
