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
        <h2>{title}</h2>
        {subtitle && <p className="text-sm text-gray-600 font-medium mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
