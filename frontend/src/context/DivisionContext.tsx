import { createContext, useContext } from 'react';
import type { DivisionRouteContext } from '@/hooks/useDivisionResources';
import type { DivisionTheme } from '@/lib/division-theme';

export type DivisionContextValue = DivisionRouteContext & {
  theme: DivisionTheme;
};

const DivisionContext = createContext<DivisionContextValue | null>(null);

export function DivisionProvider({
  value,
  children,
}: {
  value: DivisionContextValue;
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
