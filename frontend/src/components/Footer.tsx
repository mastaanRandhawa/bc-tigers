import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { usePublicSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';

const tournamentLinks = [{ label: 'Tournaments', href: '/tournaments' }];

interface FooterProps {
  className?: string;
}

export default function Footer({ className }: FooterProps) {
  const { data: settings } = usePublicSettings();
  const siteName = settings?.site_name ?? 'BC Tigers Soccer';

  return (
    <footer
      className={cn(
        'w-full shrink-0 border-t border-border bg-white',
        className,
      )}
    >
      <div className="page-container py-10 md:py-12">
        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2">
          <div className="min-w-0">
            <Link to="/" className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-primary-muted p-1.5">
                <Trophy className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <div className="flex items-center">
                <span className="text-lg font-bold tracking-tight text-foreground">BC</span>
                <span className="text-lg font-bold tracking-tight text-primary">TIGERS</span>
              </div>
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-zinc-500">
              {siteName} Tournament Hub — pick a tournament, then browse each division for
              schedules, scores, and standings.
            </p>
          </div>

          <div className="min-w-0 md:text-right">
            <h3 className="text-label mb-3">Explore</h3>
            <ul className="space-y-2">
              {tournamentLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-zinc-500 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-center text-sm text-zinc-500 sm:text-left">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
