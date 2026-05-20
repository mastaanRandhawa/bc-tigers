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
      className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 safe-x"
    >
      <div className="flex gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-2 snap-x snap-mandatory">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end ?? false}
            title={item.label}
            aria-label={item.label}
            className={({ isActive }) =>
              cn(
                'division-nav-pill inline-flex items-center gap-1.5 sm:gap-2 shrink-0 snap-start',
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
      className="min-h-dvh min-h-screen flex flex-col w-full overflow-x-hidden division-theme-root"
      style={divisionThemeStyle(theme)}
    >
      <header className="relative bg-[var(--division-primary)] text-white overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-brand-grid pointer-events-none opacity-80" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-2 safe-x">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
            <Link to="/tournaments" className="inline-flex items-center gap-1 flex-shrink-0">
              <div className="font-black tracking-tight text-xs px-2.5 py-1 rounded-2xl rounded-bl-sm relative shadow-sm bg-white text-black">
                BC
                <div
                  className="absolute -bottom-1.5 left-0 w-3 h-3 bg-white"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
                />
              </div>
              <div
                className="font-black text-xs px-2.5 py-1 rounded-full shadow-sm border-[1.5px] border-white"
                style={{ backgroundColor: 'var(--division-accent)', color: 'var(--division-accent-fg)' }}
              >
                TIGERS
              </div>
            </Link>

            <div className="flex-1 min-w-0 sm:border-l sm:border-white/15 sm:pl-4">
              <LiveScoreTicker embedded alwaysShow divisionId={division.id} />
            </div>
          </div>
        </div>

        <DivisionHero division={division} />
      </header>

      <div className="sticky top-0 z-40 bg-[var(--division-primary)] border-t border-white/10 shadow-md shrink-0">
        <DivisionNavbar items={navItems} />
      </div>

      <main className="flex-1 w-full min-w-0">
        <PageContent className="-mt-6 md:-mt-10">
          <Outlet />
        </PageContent>
      </main>
    </div>
  );
}
