import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface Footer7Link {
  name: string;
  href: string;
}

export interface Footer7Section {
  title: string;
  links: Footer7Link[];
}

export interface Footer7SocialLink {
  icon: ReactNode;
  href: string;
  label: string;
}

export interface Footer7Logo {
  url: string;
  src: string;
  alt: string;
  title: string;
}

export interface Footer7Props {
  className?: string;
  logo?: Footer7Logo;
  sections?: Footer7Section[];
  description?: string;
  socialLinks?: Footer7SocialLink[];
  copyright?: string;
  legalLinks?: Footer7Link[];
}

function FooterNavLink({ href, children }: { href: string; children: ReactNode }) {
  const className = "transition-colors hover:text-primary";

  if (href.startsWith("/")) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    );
  }

  if (href === "#") {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function Footer7({
  className,
  logo = {
    url: "/",
    src: "",
    alt: "BC Tigers FC",
    title: "BC Tigers FC",
  },
  sections = [],
  description = "",
  socialLinks = [],
  copyright = "",
  legalLinks = [],
}: Footer7Props) {
  return (
    <footer className={cn("w-full shrink-0 border-t border-border bg-card", className)}>
      <section className="py-10 md:py-14">
        <div className="page-container">
          <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start lg:text-left">
            <div className="flex w-full flex-col justify-between gap-6 lg:max-w-sm lg:items-start">
              <div className="flex items-center gap-3 lg:justify-start">
                <FooterNavLink href={logo.url}>
                  {logo.src ? (
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      title={logo.title}
                      className="h-10 w-auto object-contain"
                    />
                  ) : null}
                </FooterNavLink>
                <h2 className="font-display text-xl font-semibold text-foreground">{logo.title}</h2>
              </div>
              {description ? (
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              ) : null}
              {socialLinks.length > 0 ? (
                <ul className="flex items-center gap-5 text-muted-foreground">
                  {socialLinks.map((social) => (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        aria-label={social.label}
                        className="transition-colors hover:text-primary"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {social.icon}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {sections.length > 0 ? (
              <div className="grid w-full gap-8 sm:grid-cols-2 md:grid-cols-3 lg:max-w-2xl lg:gap-12">
                {sections.map((section) => (
                  <div key={section.title}>
                    <h3 className="mb-4 text-sm font-bold text-foreground">{section.title}</h3>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      {section.links.map((link) => (
                        <li key={`${section.title}-${link.name}`} className="font-medium">
                          <FooterNavLink href={link.href}>{link.name}</FooterNavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {(copyright || legalLinks.length > 0) && (
            <div className="mt-8 flex flex-col justify-between gap-4 border-t border-border pt-6 text-xs font-medium text-muted-foreground md:flex-row md:items-center md:text-left">
              {copyright ? <p className="order-2 md:order-1">{copyright}</p> : null}
              {legalLinks.length > 0 ? (
                <ul className="order-1 flex flex-col gap-2 md:order-2 md:flex-row md:gap-6">
                  {legalLinks.map((link) => (
                    <li key={link.name}>
                      <FooterNavLink href={link.href}>{link.name}</FooterNavLink>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </footer>
  );
}
