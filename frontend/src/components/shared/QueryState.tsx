import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

type QueryStateVariant = 'spinner' | 'skeleton-table' | 'skeleton-cards' | 'skeleton-detail';

interface QueryStateProps {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  onRetry?: () => void;
  children: ReactNode;
  loadingMessage?: string;
  variant?: QueryStateVariant;
}

function LoadingSkeleton({ variant }: { variant: QueryStateVariant }) {
  if (variant === 'skeleton-cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    );
  }

  if (variant === 'skeleton-detail') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3 rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (variant === 'skeleton-table') {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full rounded-lg" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return null;
}

export default function QueryState({
  isLoading,
  isError,
  isEmpty,
  errorMessage = 'Failed to load data. Please try again.',
  emptyMessage = 'No data found.',
  onRetry,
  children,
  loadingMessage = 'Loading...',
  variant = 'spinner',
}: QueryStateProps) {
  if (isLoading) {
    if (variant !== 'spinner') {
      return <LoadingSkeleton variant={variant} />;
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" aria-hidden />
        <p className="text-sm font-medium">{loadingMessage}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-lg mx-auto rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-medium">{errorMessage}</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-3">
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return <EmptyState message={emptyMessage} />;
  }

  return <>{children}</>;
}
