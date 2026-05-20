import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SubNavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  end?: boolean;
}

interface SubNavProps {
  items: SubNavItem[];
  label?: string;
}

export default function SubNav({ items, label }: SubNavProps) {
  return (
    <div className="border-b border-border bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 safe-x">
        {label && (
          <p className="pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
        )}
        <nav
          aria-label={label ?? 'Section navigation'}
          className="flex gap-1 overflow-x-auto no-scrollbar py-2 -mx-1"
        >
          {items.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end ?? false}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors',
                  isActive
                    ? 'bg-primary-muted text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )
              }
            >
              {item.icon && <item.icon className="w-4 h-4 shrink-0" />}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
