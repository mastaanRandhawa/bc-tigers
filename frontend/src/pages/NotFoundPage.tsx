import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, ArrowLeft } from 'lucide-react';
import AppShell from '@/components/layouts/AppShell';

export default function NotFoundPage() {
  const { pathname } = useLocation();

  return (
    <AppShell showFooter={false} headerMode="site">
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-16 text-center">
        {/* Big number */}
        <div className="relative mb-6 select-none">
          <span className="text-[8rem] font-black leading-none tracking-tighter text-primary/10 sm:text-[10rem]">
            404
          </span>
          <span className="absolute inset-0 flex items-center justify-center text-[3rem] font-black leading-none tracking-tighter text-primary sm:text-[4rem]">
            404
          </span>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
          Page not found
        </h1>
        <p className="mb-1 max-w-sm text-sm text-muted-foreground sm:text-base">
          The page{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
            {pathname}
          </code>{' '}
          doesn't exist or was moved.
        </p>
        <p className="mb-8 text-sm text-muted-foreground">
          Head back home or browse the tournament hub.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            <Home className="h-4 w-4" aria-hidden />
            Home
          </Link>
          <Link
            to="/tournaments"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <Trophy className="h-4 w-4" aria-hidden />
            Tournaments
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Go back
          </button>
        </div>
      </div>
    </AppShell>
  );
}
