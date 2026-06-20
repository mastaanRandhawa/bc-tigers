import React from 'react';
import { m } from 'motion/react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the props interface for type safety and reusability
interface MinimalistHeroProps {
  logoText?: React.ReactNode;
  navLinks?: { label: string; href: string }[];
  mainText: React.ReactNode;
  /** Override the left-column text wrapper (width, size). */
  mainTextClassName?: string;
  /** Optional call-to-action node (pass a router <Link> for client-side routing). */
  readMore?: React.ReactNode;
  imageSrc: string;
  imageAlt: string;
  /** Override the centered image sizing/fit (defaults to a bleeding portrait). */
  imageClassName?: string;
  /** Override the colored disc behind the image. */
  circleClassName?: string;
  overlayText: {
    part1: React.ReactNode;
    part2: React.ReactNode;
  };
  /** Override the giant headline typography (size, font, leading). */
  overlayClassName?: string;
  /** Override the main grid columns (default `md:grid-cols-3`). */
  gridClassName?: string;
  /** Column span/width for the image cell (e.g. `md:col-span-2`). */
  imageColClassName?: string;
  /** Column span/width for the headline cell (e.g. `md:col-span-2`). */
  headlineColClassName?: string;
  socialLinks?: { icon: LucideIcon; href: string }[];
  locationText?: React.ReactNode;
  className?: string;
  /** Extra absolutely-positioned content layered over the hero (e.g. cards). */
  children?: React.ReactNode;
}

// Helper component for navigation links
const NavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <a
    href={href}
    className="text-sm font-medium tracking-widest text-current opacity-60 transition-opacity hover:opacity-100"
  >
    {children}
  </a>
);

// Helper component for social media icons
const SocialIcon = ({ href, icon: Icon }: { href: string; icon: LucideIcon }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-current opacity-60 transition-opacity hover:opacity-100"
  >
    <Icon className="h-5 w-5" />
  </a>
);

/**
 * Minimalist editorial hero: header · [blurb · center image · giant headline] · footer.
 *
 * Theme-agnostic — colors inherit from the root's text color (via `text-current`
 * + opacity), so it works on any background. Override surfaces with `className`,
 * `circleClassName`, and `imageClassName`. Header and footer render only when
 * their content is provided, and `children` layers absolutely over the hero.
 */
export const MinimalistHero = ({
  logoText,
  navLinks,
  mainText,
  mainTextClassName,
  readMore,
  imageSrc,
  imageAlt,
  imageClassName,
  circleClassName,
  overlayText,
  overlayClassName,
  gridClassName,
  imageColClassName,
  headlineColClassName,
  socialLinks,
  locationText,
  className,
  children,
}: MinimalistHeroProps) => {
  const showHeader = Boolean(logoText || navLinks?.length);
  const showFooter = Boolean(socialLinks?.length || locationText);

  return (
    <div
      className={cn(
        'relative flex w-full flex-col items-center overflow-hidden bg-background font-sans text-foreground md:min-h-screen md:justify-between',
        className,
      )}
    >
      {/* Header */}
      {showHeader && (
        <header className="z-30 flex w-full max-w-7xl items-center justify-between">
          <m.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xl font-bold tracking-wider"
          >
            {logoText}
          </m.div>
          <div className="hidden items-center space-x-8 md:flex">
            {navLinks?.map((link) => (
              <NavLink key={link.label} href={link.href}>
                {link.label}
              </NavLink>
            ))}
          </div>
          <m.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col space-y-1.5 md:hidden"
            aria-label="Open menu"
          >
            <span className="block h-0.5 w-6 bg-current"></span>
            <span className="block h-0.5 w-6 bg-current"></span>
            <span className="block h-0.5 w-5 bg-current"></span>
          </m.button>
        </header>
      )}

      {/* Main Content Area */}
      <div className="flex w-full flex-grow flex-col items-center justify-center px-4 py-10 sm:px-6 md:px-10 md:py-12 lg:px-12">
        <div
          className={cn(
            'relative grid w-full max-w-7xl grid-cols-1 items-center justify-items-center gap-8 md:grid-cols-3 md:justify-items-stretch md:gap-x-8 md:gap-y-0 lg:gap-x-10',
            gridClassName,
          )}
        >
        {/* Headline — first on mobile, right column on desktop */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className={cn(
            'z-20 order-1 flex w-full flex-col items-center justify-center text-center md:order-3 md:items-start md:justify-center md:text-left',
            headlineColClassName,
          )}
        >
          <h1
            className={cn(
              'text-7xl font-extrabold text-current md:text-8xl lg:text-9xl',
              overlayClassName,
            )}
          >
            {overlayText.part1}
            <br />
            {overlayText.part2}
          </h1>
        </m.div>

        {/* Center Image with Circle */}
        <div
          className={cn(
            'relative order-2 flex w-full items-center justify-center md:order-2',
            imageColClassName,
          )}
        >
          <m.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className={cn(
              'absolute z-0 h-[300px] w-[300px] rounded-full bg-yellow-400/90 md:h-[400px] md:w-[400px] lg:h-[500px] lg:w-[500px]',
              circleClassName,
            )}
          ></m.div>
          <m.img
            src={imageSrc}
            alt={imageAlt}
            className={cn(
              'relative z-10 h-auto w-56 object-contain md:w-64 lg:w-72',
              imageClassName,
            )}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = `https://placehold.co/400x600/eab308/ffffff?text=Image+Not+Found`;
            }}
          />
        </div>

        {/* Body copy — last on mobile, left column on desktop */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="z-20 order-3 w-full max-w-md text-center md:order-1 md:max-w-none md:self-center md:text-left"
        >
          <div
            className={cn(
              'mx-auto text-sm leading-relaxed opacity-80 md:mx-0',
              mainTextClassName,
            )}
          >
            {mainText}
          </div>
          {readMore && <div className="mt-4">{readMore}</div>}
        </m.div>
        </div>
      </div>

      {/* Footer Elements */}
      {showFooter && (
        <footer className="z-30 flex w-full max-w-7xl items-center justify-center gap-4 px-4 pb-6 sm:px-6 md:justify-end md:px-10 md:pb-8 lg:px-12">
          {socialLinks?.length ? (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="flex items-center space-x-4"
            >
              {socialLinks.map((link, index) => (
                <SocialIcon key={index} href={link.href} icon={link.icon} />
              ))}
            </m.div>
          ) : null}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.3 }}
            className="text-sm font-medium opacity-80"
          >
            {locationText}
          </m.div>
        </footer>
      )}

      {children}
    </div>
  );
};
