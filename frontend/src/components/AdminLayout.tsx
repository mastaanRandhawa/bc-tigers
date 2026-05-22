import type { ReactNode } from 'react';
import SiteHeader from '@/components/SiteHeader';
import { AdminSidebar, AdminMobileNav } from '@/components/admin/AdminNav';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

export default function AdminLayout({ children, title, description, action }: AdminLayoutProps) {
  return (
    <div className="min-h-dvh min-h-screen flex flex-col w-full overflow-x-hidden admin-shell">
      <SiteHeader variant="admin" />

      {/* pt-14 pushes content below the fixed header (h-14 = 56px) */}
      <div className="flex flex-1 min-h-0 w-full pt-14">
        <AdminSidebar />

        <div className="flex flex-1 flex-col min-w-0">
          <AdminMobileNav />

          <main className="flex-1 w-full min-w-0">
            <div className="page-container py-4 sm:py-5">
              {(title || action) && (
                <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                  <div className="min-w-0">
                    {title && <h1 className="text-page-title m-0">{title}</h1>}
                    {description && (
                      <p className="text-body-sm mt-1.5 max-w-2xl">{description}</p>
                    )}
                  </div>
                  {action && <div className="shrink-0">{action}</div>}
                </div>
              )}

              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
