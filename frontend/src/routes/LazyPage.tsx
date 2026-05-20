import { Suspense, type ReactNode } from 'react';
import PageLayout from '@/components/PageLayout';
import PageLoader from '@/components/shared/PageLoader';

export function LazyPage({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <PageLayout>
          <PageLoader />
        </PageLayout>
      }
    >
      {children}
    </Suspense>
  );
}
