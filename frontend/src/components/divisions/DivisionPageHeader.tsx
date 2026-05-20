import type { ReactNode } from 'react';

interface DivisionPageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function DivisionPageHeader({ title, subtitle, action }: DivisionPageHeaderProps) {
  return (
    <div className="division-page-header flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-section m-0">{title}</h2>
        {subtitle && <p className="text-body-sm mt-1.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
