import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '@/components/layouts/AppShell';
import SubNav, { type SubNavItem } from '@/components/layouts/SubNav';
import { Button } from '@/components/ui/button';

export type { SubNavItem as PortalNavItem };

interface PortalLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  nav: SubNavItem[];
}

export default function PortalLayout({ children, title, subtitle, nav }: PortalLayoutProps) {
  return (
    <AppShell
      showFooter={false}
      subNav={<SubNav items={nav} label={subtitle ?? title} />}
    >
      <div className="page-container py-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-page-title m-0">{title}</h1>
          <Button asChild variant="default" size="sm">
            <Link to="/">Public Site</Link>
          </Button>
        </div>
        {children}
      </div>
    </AppShell>
  );
}
