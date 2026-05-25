import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminNavGroups, type AdminNavGroup } from '@/components/admin/admin-nav';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetTrigger,
} from '@/components/ui/sheet';

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

export function AdminMobileNav({
  groups = adminNavGroups,
  headerVisible = true,
}: {
  groups?: AdminNavGroup[];
  headerVisible?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close drawer when route changes (user tapped a nav item)
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const allItems = groups.flatMap((g) => g.items);
  const activeItem = allItems.find((item) =>
    item.href === '/admin/dashboard'
      ? location.pathname === item.href
      : location.pathname.startsWith(item.href),
  );

  return (
    <div className="admin-mobile-nav" style={{ top: headerVisible ? '3.5rem' : '0px' }}>
      <div className="flex items-center gap-3 px-3 py-2 safe-x">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open admin navigation"
              aria-expanded={open}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground touch-manipulation"
            >
              <Menu className="h-[18px] w-[18px] shrink-0" aria-hidden />
              <span>Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 max-w-[80vw] gap-0 p-0">
            <SheetHeader className="border-b border-border px-5 py-4">
              <SheetTitle className="text-base">Admin Menu</SheetTitle>
            </SheetHeader>
            <SheetBody className="px-4 py-4">
              <div className="space-y-5">
                {groups.map((group) => (
                  <div key={group.label}>
                    <p className="text-label mb-2 px-3">{group.label}</p>
                    <nav
                      aria-label={`${group.label} admin navigation`}
                      className="space-y-0.5"
                    >
                      {group.items.map((item) => (
                        <AdminNavLink key={item.href} {...item} />
                      ))}
                    </nav>
                  </div>
                ))}
              </div>
            </SheetBody>
          </SheetContent>
        </Sheet>

        {activeItem && (
          <div className="flex min-w-0 items-center gap-1.5 text-sm">
            <activeItem.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate font-medium text-foreground">{activeItem.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
