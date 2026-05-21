import type { ReactNode } from 'react';
import SurfaceCard from '@/components/design-system/SurfaceCard';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <SurfaceCard as="section" variant="default" className={cn('space-y-4', className)}>
      <div>
        <h3 className="m-0 text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="text-meta m-0 mt-0.5">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </SurfaceCard>
  );
}
