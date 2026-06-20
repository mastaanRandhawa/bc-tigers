import { FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { usePublicSettings } from '@/hooks/useSettings';
import { Footer7 } from '@/components/ui/footer-7';
import logoUrl from '@/assets/logo.png';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

const footerSections = [
  {
    title: 'Competitions',
    links: [
      { name: 'Tournaments', href: '/tournaments' },
      { name: 'Live matches', href: '/live' },
      { name: 'Home', href: '/' },
    ],
  },
  {
    title: 'Account',
    links: [
      { name: 'Sign in', href: '/login' },
      { name: 'Profile', href: '/profile' },
    ],
  },
  {
    title: 'Club',
    links: [{ name: 'BC Tigers FC', href: '/' }],
  },
];

const socialLinks = [
  { icon: <FaInstagram className="size-5" aria-hidden />, href: 'https://www.instagram.com/', label: 'Instagram' },
  { icon: <FaFacebook className="size-5" aria-hidden />, href: 'https://www.facebook.com/', label: 'Facebook' },
  { icon: <FaLinkedin className="size-5" aria-hidden />, href: 'https://www.linkedin.com/', label: 'LinkedIn' },
];

export default function Footer({ className }: FooterProps) {
  const { data: settings } = usePublicSettings();
  const siteName = settings?.site_name ?? 'BC Tigers FC';
  const year = new Date().getFullYear();

  return (
    <Footer7
      className={cn(className)}
      logo={{
        url: '/',
        src: logoUrl,
        alt: siteName,
        title: siteName,
      }}
      description={`${siteName} tournament hub — browse schedules, live scores, standings, and knockout brackets for every competition.`}
      sections={footerSections}
      socialLinks={socialLinks}
      copyright={`© ${year} ${siteName}. All rights reserved.`}
      legalLinks={[
        { name: 'Privacy Policy', href: '#' },
        { name: 'Terms of Use', href: '#' },
      ]}
    />
  );
}
