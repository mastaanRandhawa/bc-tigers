import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { AuthInitializer } from '@/providers/AuthInitializer';
import { MotionProvider } from '@/components/motion/MotionProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionProvider>
        <AuthInitializer>
          {children}
          <Toaster richColors position="top-center" closeButton />
        </AuthInitializer>
      </MotionProvider>
    </QueryClientProvider>
  );
}
