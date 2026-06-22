import type { ReactNode } from 'react';
import SiteHeader from '@/components/SiteHeader';
import { AdminSidebar, AdminMobileNav } from '@/components/admin/AdminNav';
import { useRealtimeInvalidation } from '@/hooks/useMatches';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

export default function AdminLayout({ children, title, description, action }: AdminLayoutProps) {
  useRealtimeInvalidation();

  return (
    <div className="min-h-dvh min-h-screen flex flex-col w-full overflow-x-hidden admin-shell">
      <SiteHeader variant="admin" />

      {/* pt-14 pushes content below the fixed header (h-14 = 56px) */}
      <div className="flex flex-1 min-h-0 w-full pt-14">
        <AdminSidebar />

        <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
          <AdminMobileNav />

          <main className="flex-1 w-full min-w-0">
            <div className="page-container py-4 sm:py-6 max-w-full">
              {(title || action) && (
                <div className="mb-5 pb-4 border-b border-border sm:border-b-0 sm:pb-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0 flex-1">
                      {title && (
                        <h1 className="text-xl sm:text-2xl font-bold font-display text-foreground m-0 break-words leading-tight">
                          {title}
                        </h1>
                      )}
                      {description && (
                        <p className="text-body-sm mt-1 max-w-2xl text-muted-foreground break-words">{description}</p>
                      )}
                    </div>
                    {action && (
                      <div className="shrink-0 self-start">{action}</div>
                    )}
                  </div>
                </div>
              )}

              {/* overflow-x-auto wrapper ensures dense tables don't break mobile layout */}
              <div className="min-w-0 overflow-x-auto">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
