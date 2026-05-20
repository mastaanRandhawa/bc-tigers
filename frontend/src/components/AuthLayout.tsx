import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import BrandLogo from '@/components/shared/BrandLogo';
import AppShell from '@/components/layouts/AppShell';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <AppShell showFooter={false} headerMode="minimal" className="flex flex-col items-center justify-center px-4 py-12">
      <BrandLogo className="mb-8" imageClassName="h-14" />

      <Card className="w-full max-w-md shadow-md">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {children}
        </CardContent>
      </Card>
    </AppShell>
  );
}
