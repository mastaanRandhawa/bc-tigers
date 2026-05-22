import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PillNavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  end?: boolean;
}

interface PillNavProps {
  items: PillNavItem[];
  ariaLabel?: string;
  className?: string;
}

export default function PillNav({ items, ariaLabel = 'Section navigation', className }: PillNavProps) {
  return (
    <nav aria-label={ariaLabel} className={cn('page-container', className)}>
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-secondary p-1 no-scrollbar snap-x snap-mandatory">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.end ?? false}
            title={item.label}
            className={({ isActive }) =>
              cn(
                'inline-flex shrink-0 snap-start items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-card text-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/60',
              )
            }
          >
            {({ isActive: _isActive }) => (
              <>
                {item.icon && (
                  <item.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                )}
                <span className="hidden sm:inline">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
