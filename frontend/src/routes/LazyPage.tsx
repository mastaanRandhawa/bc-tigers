import { Suspense, type ReactNode } from 'react';
import AppShell from '@/components/layouts/AppShell';
import PageLoader from '@/components/shared/PageLoader';

export function LazyPage({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <AppShell showFooter={false}>
          <PageLoader />
        </AppShell>
      }
    >
      <div className="page-fade-in">{children}</div>
    </Suspense>
  );
}
