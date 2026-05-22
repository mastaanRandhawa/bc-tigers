import { Suspense, type ReactNode } from 'react';
import AppShell from '@/components/layouts/AppShell';
import PageLoader from '@/components/shared/PageLoader';
import { PageFade } from '@/components/motion/PageTransition';

export function LazyPage({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <AppShell showFooter={false}>
          <PageLoader />
        </AppShell>
      }
    >
      <PageFade>{children}</PageFade>
    </Suspense>
  );
}
