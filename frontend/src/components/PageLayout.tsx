import type { ReactNode } from 'react';
import AppShell from '@/components/layouts/AppShell';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  showFooter?: boolean;
  heroTheme?: boolean;
}

export default function PageLayout({
  children,
  className,
  showFooter = true,
  heroTheme = false,
}: PageLayoutProps) {
  return (
    <AppShell className={className} showFooter={showFooter} heroTheme={heroTheme}>
      {children}
    </AppShell>
  );
}
