import { Suspense, type ReactNode } from 'react';
import { motion } from 'motion/react';
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </Suspense>
  );
}
