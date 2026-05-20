import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import AppShell from '@/components/layouts/AppShell';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <AppShell showFooter={false} headerMode="minimal" className="flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2.5 mb-8">
        <div className="bg-primary-muted p-2 rounded-lg">
          <Trophy className="w-6 h-6 text-primary" />
        </div>
        <div className="flex items-center">
          <span className="font-bold text-foreground text-2xl tracking-tight">BC</span>
          <span className="font-bold text-primary text-2xl tracking-tight">TIGERS</span>
        </div>
      </Link>

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
