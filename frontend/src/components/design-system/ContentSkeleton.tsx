import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ContentSkeletonProps {
  variant?: 'section' | 'card' | 'hero' | 'table';
  rows?: number;
  className?: string;
}

export default function ContentSkeleton({
  variant = 'section',
  rows = 3,
  className,
}: ContentSkeletonProps) {
  if (variant === 'hero') {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-12 w-3/4 max-w-md" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('grid gap-3 sm:grid-cols-2', className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('ds-surface p-4 space-y-3', className)}>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}
