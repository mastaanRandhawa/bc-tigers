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
    <div className="border-b border-border bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 safe-x">
        {label && (
          <p className="pt-3 text-label">{label}</p>
        )}
        <nav
          aria-label={label ?? 'Section navigation'}
          className="flex gap-1 overflow-x-auto no-scrollbar py-2.5"
        >
          <div className="flex gap-1 bg-zinc-100/80 rounded-xl p-1">
            {items.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.end ?? false}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-200',
                    isActive
                      ? 'bg-white text-foreground shadow-sm font-semibold'
                      : 'text-zinc-500 hover:text-foreground hover:bg-white/60',
                  )
                }
              >
                {item.icon && <item.icon className="w-4 h-4 shrink-0" />}
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
