import type { ReactNode } from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QueryStateProps {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  onRetry?: () => void;
  children: ReactNode;
  loadingMessage?: string;
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
}: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#0038FF] mb-3" />
        <p className="text-sm font-medium">{loadingMessage}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-gray-600 font-medium mb-4">{errorMessage}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <Inbox className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}
