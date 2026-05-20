import type { ReactNode } from 'react';
import AppShell from '@/components/layouts/AppShell';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  showFooter?: boolean;
  heroTheme?: boolean;
  headerMode?: 'site' | 'hero' | 'minimal' | 'admin';
}

export default function PageLayout({
  children,
  className,
  showFooter = true,
  heroTheme = false,
  headerMode,
}: PageLayoutProps) {
  return (
    <AppShell
      className={className}
      showFooter={showFooter}
      heroTheme={heroTheme}
      headerMode={headerMode}
    >
      {children}
    </AppShell>
  );
}
