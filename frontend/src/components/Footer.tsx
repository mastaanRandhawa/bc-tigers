import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { usePublicSettings } from '@/hooks/useSettings';

const tournamentLinks = [
  { label: 'Tournaments', href: '/tournaments' },
  { label: 'Schedule', href: '/schedule' },
  { label: 'Matches', href: '/matches' },
  { label: 'Standings', href: '/standings' },
  { label: 'Brackets', href: '/brackets' },
  { label: 'Teams', href: '/teams' },
  { label: 'Players', href: '/players' },
  { label: 'Statistics', href: '/stats' },
  { label: 'Venues', href: '/venues' },
];

export default function Footer() {
  const { data: settings } = usePublicSettings();
  const siteName = settings?.site_name ?? 'BC Tigers Soccer';

  return (
    <footer className="w-full shrink-0 border-t border-border bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 safe-x w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          <div className="min-w-0">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="bg-primary-muted p-1.5 rounded-lg">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-center">
                <span className="font-bold text-foreground text-lg tracking-tight">BC</span>
                <span className="font-bold text-primary text-lg tracking-tight">TIGERS</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              {siteName} Tournament Hub — browse by division from any tournament page, or use the global indexes for schedules, scores, standings, and more.
            </p>
          </div>

          <div className="min-w-0">
            <h3 className="text-label mb-3">Tournament</h3>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
              {tournamentLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
