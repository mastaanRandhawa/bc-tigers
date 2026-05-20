import type { ReactNode } from 'react';
import { useDivisionRoute } from '@/context/DivisionContext';

interface DivisionPageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function DivisionPageHeader({ title, subtitle, action }: DivisionPageHeaderProps) {
  const { theme } = useDivisionRoute();

  return (
    <div
      className="division-page-header flex flex-wrap items-start justify-between gap-3"
      style={{ borderLeftColor: theme.primary }}
    >
      <div>
        <h2
          className="text-xl font-semibold tracking-tight font-display m-0"
          style={{ color: theme.primary }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-body-sm mt-1 m-0">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
