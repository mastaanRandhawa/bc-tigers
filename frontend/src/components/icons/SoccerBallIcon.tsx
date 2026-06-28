import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

/** Lucide-style soccer ball for score actions. */
export function SoccerBallIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-4 w-4', className)}
      aria-hidden
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7l2.5 1.8-.9 3h-3.2l-.9-3L12 7z" />
      <path d="M12 7V3.5" />
      <path d="m14.5 8.8 3.1-1.8" />
      <path d="m9.5 8.8-3.1-1.8" />
      <path d="m16.2 13.5 2.8 1.6" />
      <path d="m7.8 13.5-2.8 1.6" />
      <path d="M12 17v3.5" />
    </svg>
  );
}
