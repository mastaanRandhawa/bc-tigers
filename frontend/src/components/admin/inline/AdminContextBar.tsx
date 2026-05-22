import { Link } from 'react-router-dom';
import { Shield, ExternalLink } from 'lucide-react';
import { useCanAdminEdit } from '@/hooks/useCanAdminEdit';
import { cn } from '@/lib/utils';

interface AdminContextBarProps {
  /** Label like "Editing tournament" or "Editing division" */
  label: string;
  /** Link to the corresponding admin portal page */
  advancedHref: string;
  advancedLabel?: string;
  className?: string;
  /** Optional primary action slot (e.g. an Add button) */
  actions?: React.ReactNode;
}

/**
 * A compact bar shown only to admins at the top of a content section,
 * signalling that inline editing is available and offering an escape hatch
 * to the full admin portal.
 */
export function AdminContextBar({
  label,
  advancedHref,
  advancedLabel = 'Advanced',
  className,
  actions,
}: AdminContextBarProps) {
  const canEdit = useCanAdminEdit();
  if (!canEdit) return null;

  return (
    <div
      className={cn(
        'mb-4 flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs',
        className,
      )}
    >
      <Shield className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
      <span className="font-medium text-primary">{label}</span>
      {actions && <div className="ml-1 flex items-center gap-1.5">{actions}</div>}
      <Link
        to={advancedHref}
        className="ml-auto inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        {advancedLabel}
        <ExternalLink className="h-3 w-3" aria-hidden />
      </Link>
    </div>
  );
}
