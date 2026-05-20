import { createContext, useContext } from 'react';
import type { DivisionRouteContext } from '@/hooks/useDivisionResources';

const DivisionContext = createContext<DivisionRouteContext | null>(null);

export function DivisionProvider({
  value,
  children,
}: {
  value: DivisionRouteContext;
  children: React.ReactNode;
}) {
  return <DivisionContext.Provider value={value}>{children}</DivisionContext.Provider>;
}

export function useDivisionRoute() {
  const ctx = useContext(DivisionContext);
  if (!ctx) {
    throw new Error('useDivisionRoute must be used within DivisionLayout');
  }
  return ctx;
}
