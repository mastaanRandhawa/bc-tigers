import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon: Icon, children }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden border-b border-border bg-card">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/40" />
      <div className="page-container relative py-6">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            {Icon && (
              <div className="mb-2 inline-flex rounded-lg border border-border bg-card p-2 shadow-sm">
                <Icon className="h-4 w-4 text-primary" aria-hidden />
              </div>
            )}
            <h1 className="text-page-title m-0">{title}</h1>
            {subtitle && <p className="mt-2 max-w-2xl text-body m-0">{subtitle}</p>}
          </div>
          {children && <div className="shrink-0">{children}</div>}
        </div>
      </div>
    </div>
  );
}
