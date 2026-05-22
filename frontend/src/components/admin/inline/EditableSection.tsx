import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useCanAdminEdit } from '@/hooks/useCanAdminEdit';

interface EditableSectionProps {
  /** Visible to everyone */
  children: ReactNode;
  /** Admin-only action controls rendered to the right of the title row */
  actions?: ReactNode;
  className?: string;
}

/**
 * Wrapper that shows admin action controls next to its content header
 * when the current user has editing rights. The children are always visible.
 */
export function EditableSection({ children, actions, className }: EditableSectionProps) {
  const canEdit = useCanAdminEdit();

  return (
    <div className={cn('relative', className)}>
      {canEdit && actions && (
        <div className="absolute right-0 top-0 z-10 flex items-center gap-1.5">
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
