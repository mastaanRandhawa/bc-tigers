import { cn } from '@/lib/utils';

import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { useRealtimeInvalidation } from '@/hooks/useMatches';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
  subNav?: React.ReactNode;
  showFooter?: boolean;
  heroTheme?: boolean;
  headerMode?: 'site' | 'hero' | 'minimal' | 'admin';
  showLiveTicker?: boolean;
}

export default function AppShell({
  children,
  className,
  subNav,
  showFooter = true,
  heroTheme = false,
  headerMode,
  showLiveTicker,
}: AppShellProps) {
  const headerVariant = headerMode ?? 'hero';
  const tickerVisible = showLiveTicker ?? true;
  useRealtimeInvalidation();

  return (
    <div
      className={cn(
        'min-h-dvh min-h-screen flex flex-col w-full overflow-x-hidden',
        heroTheme ? 'bg-primary' : 'bg-surface-muted',
      )}
    >
      <SiteHeader variant={headerVariant} showLiveTicker={tickerVisible} />
      {subNav}
      <main
        className={cn(
          'flex-1 w-full min-w-0',
          !heroTheme && 'pt-14',
          !heroTheme && tickerVisible && headerVariant !== 'admin' && 'max-md:pt-[6.75rem]',
          className,
        )}
      >
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
