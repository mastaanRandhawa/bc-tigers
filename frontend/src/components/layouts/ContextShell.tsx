import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import LiveScoreTicker from '@/components/LiveScoreTicker';
import BrandLogo from '@/components/shared/BrandLogo';
import PageContent from '@/components/shared/PageContent';
import ResponsiveContextNav from '@/components/design-system/ResponsiveContextNav';
import type { SegmentedNavItem } from '@/components/design-system/SegmentedNav';
import type { DivisionTheme } from '@/lib/division-theme';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ContextShellProps {
  children: ReactNode;
  hero: ReactNode;
  breadcrumbItems: BreadcrumbItem[];
  navItems: SegmentedNavItem[];
  theme?: DivisionTheme;
  themeStyle?: React.CSSProperties;
  rootClassName?: string;
  tickerVariant?: 'dark' | 'light';
  divisionId?: string;
  accentBar?: boolean;
  navPrimaryCount?: number;
}

export default function ContextShell({
  children,
  hero,
  breadcrumbItems,
  navItems,
  theme,
  themeStyle,
  rootClassName,
  tickerVariant = 'light',
  divisionId,
  accentBar = false,
  navPrimaryCount = 5,
}: ContextShellProps) {
  return (
    <div
      className={cn(
        'tournament-ui flex min-h-dvh min-h-screen w-full flex-col overflow-x-hidden',
        theme ? 'division-theme-root' : '',
        rootClassName ?? 'bg-surface-muted',
      )}
      style={themeStyle}
    >
      {accentBar && theme && (
        <div className="h-1 w-full shrink-0 border-b-2 border-foreground" style={{ backgroundColor: theme.primary }} aria-hidden />
      )}

      <header className="relative shrink-0 overflow-hidden border-b-2 border-foreground">
        <div
          className={cn(
            'page-container relative z-10 border-b-2 py-2',
            tickerVariant === 'dark'
              ? 'border-foreground bg-foreground text-white'
              : 'border-foreground bg-white',
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo compact />
            <div
              className={cn(
                'hidden min-w-0 flex-1 border-l-2 pl-3 md:block',
                tickerVariant === 'dark' ? 'border-white/20' : 'border-foreground/15',
              )}
            >
              <LiveScoreTicker
                embedded
                alwaysShow
                divisionId={divisionId}
                variant={tickerVariant}
              />
            </div>
          </div>
        </div>
        <div className={cn('border-b-2 md:hidden', tickerVariant === 'dark' ? 'border-foreground' : 'border-foreground')}>
          <LiveScoreTicker embedded alwaysShow divisionId={divisionId} variant={tickerVariant} />
        </div>
        {hero}
      </header>

      <div className="sticky top-0 z-40 shrink-0 border-b-2 border-foreground bg-white shadow-hard-sm">
        <nav
          aria-label="Context breadcrumb"
          className="page-container flex min-w-0 items-center gap-1 overflow-x-auto border-b-2 border-foreground/10 py-1.5 text-xs no-scrollbar"
        >
          {breadcrumbItems.map((item, i) => (
            <span key={`${item.label}-${i}`} className="inline-flex min-w-0 shrink-0 items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-foreground/25" aria-hidden />}
              {item.href ? (
                <Link
                  to={item.href}
                  className="max-w-[9rem] truncate font-bold uppercase tracking-wide text-foreground/50 transition-colors hover:text-foreground sm:max-w-xs"
                  title={item.label}
                >
                  {item.label}
                </Link>
              ) : (
                <span className="truncate font-black uppercase tracking-tight text-foreground">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="py-1.5">
          <ResponsiveContextNav
            items={navItems}
            theme={theme}
            primaryCount={navPrimaryCount}
          />
        </div>
      </div>

      <main className="min-w-0 w-full flex-1 page-fade-in">
        <PageContent className="-mt-1 md:-mt-2">{children}</PageContent>
      </main>
    </div>
  );
}
