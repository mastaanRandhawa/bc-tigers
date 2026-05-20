import { cn } from '@/lib/utils';

import SiteHeader from '@/components/SiteHeader';

import Footer from '@/components/Footer';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
  subNav?: React.ReactNode;
  showFooter?: boolean;
  heroTheme?: boolean;
  headerMode?: 'site' | 'hero' | 'minimal' | 'admin';
}

export default function AppShell({
  children,
  className,
  subNav,
  showFooter = true,
  heroTheme = false,
  headerMode,
}: AppShellProps) {
  const headerVariant = headerMode ?? (heroTheme ? 'hero' : 'site');

  return (
    <div
      className={cn(
        'min-h-dvh min-h-screen flex flex-col w-full overflow-x-hidden',
        heroTheme ? 'bg-primary' : 'bg-surface-muted',
      )}
    >
      <SiteHeader variant={headerVariant} />
      {subNav}
      <main className={cn('flex-1 w-full min-w-0', className)}>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
