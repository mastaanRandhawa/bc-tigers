import { Link } from 'react-router-dom';
import { Trophy, Mail, Phone, MapPin } from 'lucide-react';
import { usePublicSettings } from '@/hooks/useSettings';

const footerLinks = {
  Tournaments: [
    { label: 'All Tournaments', href: '/tournaments' },
    { label: 'Schedule', href: '/schedule' },
    { label: 'Standings', href: '/standings' },
    { label: 'Brackets', href: '/brackets' },
  ],
  Teams: [
    { label: 'All Teams', href: '/teams' },
    { label: 'Players', href: '/players' },
    { label: 'Statistics', href: '/stats' },
    { label: 'Venues', href: '/venues' },
  ],
  Info: [
    { label: 'About', href: '/about' },
    { label: 'News', href: '/news' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Rules', href: '/rules' },
    { label: 'Contact', href: '/contact' },
  ],
};

export default function Footer() {
  const { data: settings } = usePublicSettings();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 safe-x">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="bg-[#CCFF00] p-1.5 rounded-xl">
                <Trophy className="w-5 h-5 text-black" />
              </div>
              <div className="flex items-center">
                <span className="font-black text-white text-xl tracking-tight">BC</span>
                <span className="font-black text-[#CCFF00] text-xl tracking-tight">TIGERS</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6">
              {settings?.site_name ?? 'BC Tigers Soccer'} — British Columbia&apos;s premier soccer tournament management platform.
            </p>
            <div className="space-y-2">
              {settings?.contact_address && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin className="w-4 h-4 text-[#CCFF00] flex-shrink-0" />
                  <span>{settings.contact_address}</span>
                </div>
              )}
              {settings?.contact_email && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail className="w-4 h-4 text-[#CCFF00] flex-shrink-0" />
                  <span>{settings.contact_email}</span>
                </div>
              )}
              {settings?.contact_phone && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Phone className="w-4 h-4 text-[#CCFF00] flex-shrink-0" />
                  <span>{settings.contact_phone}</span>
                </div>
              )}
            </div>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="font-bold text-sm uppercase tracking-wider text-[#CCFF00] mb-3">{section}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} {settings?.site_name ?? 'BC Tigers Soccer'}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/rules" className="text-xs text-gray-500 hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/rules" className="text-xs text-gray-500 hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
