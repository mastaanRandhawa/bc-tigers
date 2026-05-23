import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminNavGroups, type AdminNavGroup } from '@/components/admin/admin-nav';

function AdminNavLink({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  return (
    <NavLink
      to={href}
      end={href === '/admin/dashboard'}
      className={({ isActive }) =>
        cn('admin-sidebar-link', isActive && 'admin-sidebar-link-active')
      }
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </NavLink>
  );
}

export function AdminSidebar({ groups = adminNavGroups }: { groups?: AdminNavGroup[] }) {
  return (
    <aside className="admin-sidebar">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-label px-3 mb-2">{group.label}</p>
            <nav aria-label={`${group.label} admin navigation`} className="space-y-0.5">
              {group.items.map((item) => (
                <AdminNavLink key={item.href} {...item} />
              ))}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function AdminMobileNav({ groups = adminNavGroups }: { groups?: AdminNavGroup[] }) {
  const items = groups.flatMap((group) => group.items);

  return (
    <div className="admin-mobile-nav">
      <nav
        aria-label="Admin mobile navigation"
        className="flex gap-1 overflow-x-auto no-scrollbar px-3 py-2 safe-x snap-x snap-mandatory"
      >
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/admin/dashboard'}
            aria-label={item.label}
            className={({ isActive }) =>
              cn(
                'admin-mobile-nav-item',
                isActive ? 'admin-mobile-nav-item-active' : 'admin-mobile-nav-item-inactive',
              )
            }
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" aria-hidden />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
