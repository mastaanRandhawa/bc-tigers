import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon: Icon, children }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden border-b-2 border-foreground bg-white">
      <div className="pointer-events-none absolute inset-0 bg-bauhaus-grid opacity-50" />
      <div className="absolute top-0 left-0 h-full w-1.5 bg-primary md:w-2" aria-hidden />
      <div
        className="bauhaus-accent-square pointer-events-none absolute -right-4 top-4 h-16 w-16 rotate-12 border-foreground/10 bg-bauhaus-yellow/30"
        aria-hidden
      />
      <div className="page-container relative py-6">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            {Icon && (
              <div className="mb-3 inline-flex border-2 border-foreground bg-primary-muted p-2 shadow-hard-sm">
                <Icon className="h-4 w-4 text-primary" aria-hidden />
              </div>
            )}
            <h1 className="text-page-title m-0">{title}</h1>
            {subtitle && <p className="text-body mt-2 max-w-2xl m-0 normal-case">{subtitle}</p>}
          </div>
          {children && <div className="shrink-0">{children}</div>}
        </div>
      </div>
    </div>
  );
}
