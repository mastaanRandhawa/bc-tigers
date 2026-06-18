import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { usePublicSettings } from '@/hooks/useSettings';
import BrandLogo from '@/components/shared/BrandLogo';
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
        'w-full shrink-0 border-t border-border bg-card',
        className,
      )}
    >
      <div className="page-container py-10 md:py-12">
        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2">
          <div className="min-w-0">
            <BrandLogo className="mb-4" imageClassName="h-10" />
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {siteName} Tournament Hub — pick a tournament, then browse each division for
              schedules, scores, and standings.
            </p>
            {(settings?.contact_email || settings?.contact_phone || settings?.contact_address) && (
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {settings.contact_email && (
                  <li className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <a href={`mailto:${settings.contact_email}`} className="hover:text-primary">
                      {settings.contact_email}
                    </a>
                  </li>
                )}
                {settings.contact_phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <a href={`tel:${settings.contact_phone}`} className="hover:text-primary">
                      {settings.contact_phone}
                    </a>
                  </li>
                )}
                {settings.contact_address && (
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>{settings.contact_address}</span>
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="min-w-0 md:text-right">
            <h3 className="text-label mb-3">Explore</h3>
            <ul className="space-y-2">
              {tournamentLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
