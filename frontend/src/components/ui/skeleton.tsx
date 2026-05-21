import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse bg-bauhaus-muted border-2 border-foreground/10', className)}
      {...props}
    />
  );
}

export { Skeleton };
