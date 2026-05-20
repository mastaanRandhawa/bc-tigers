import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon: Icon, children }: PageHeaderProps) {
  return (
    <div className="relative bg-hero-gradient border-b border-border overflow-hidden">
      <div className="absolute inset-0 bg-brand-grid pointer-events-none opacity-50" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/40" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-10 safe-x">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 min-w-0">
          <div className="min-w-0 flex-1">
            {Icon && (
              <div className="mb-3 inline-flex rounded-lg bg-primary-muted p-2 border border-primary/15">
                <Icon className="w-5 h-5 text-primary" aria-hidden />
              </div>
            )}
            <h1 className="text-page-title m-0">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-body max-w-2xl">{subtitle}</p>
            )}
          </div>
          {children && <div className="shrink-0">{children}</div>}
        </div>
      </div>
    </div>
  );
}
