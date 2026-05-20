import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon: Icon, children }: PageHeaderProps) {
  const words = title.split(' ');
  const firstWord = words[0] ?? title;
  const restWords = words.slice(1).join(' ');

  return (
    <div className="relative bg-primary overflow-hidden">
      <div className="absolute inset-0 bg-brand-grid pointer-events-none" />
      <div className="relative max-w-[1440px] mx-auto px-6 md:px-10 py-10 md:py-14 safe-x">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 min-w-0">
          <div className="min-w-0 flex-1">
            {Icon && (
              <div className="mb-4 inline-flex rounded-full bg-white/15 p-2.5 border border-white/30">
                <Icon className="w-5 h-5 text-primary-muted" aria-hidden />
              </div>
            )}
            <div className="space-y-1 md:space-y-2">
              <h1
                className={cn(
                  'hero-headline text-[clamp(2.5rem,8vw,5rem)] text-primary-muted m-0',
                  !restWords && 'text-white'
                )}
              >
                {firstWord.toUpperCase()}
              </h1>
              {restWords && (
                <h1 className="hero-headline text-[clamp(2.75rem,9vw,5.5rem)] text-white m-0 pl-[5%] md:pl-[10%]">
                  {restWords.toUpperCase()}
                </h1>
              )}
            </div>
            {subtitle && (
              <p className="mt-4 text-body max-w-2xl text-white/90">
                {subtitle}
              </p>
            )}
          </div>
          {children && <div className="shrink-0">{children}</div>}
        </div>
      </div>
    </div>
  );
}
