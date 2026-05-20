import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '@/components/layouts/AppShell';
import SubNav, { type SubNavItem } from '@/components/layouts/SubNav';

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 safe-x w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-display text-2xl md:text-3xl">{title}</h1>
          <Link
            to="/"
            className="inline-flex h-9 items-center px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            Public Site
          </Link>
        </div>
        {children}
      </div>
    </AppShell>
  );
}
