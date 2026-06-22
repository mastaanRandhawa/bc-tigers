import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BracketScrollAreaProps {
  children: ReactNode;
  className?: string;
}

export function BracketScrollArea({ children, className }: BracketScrollAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState]);

  const scrollBy = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  const showHints = canScrollLeft || canScrollRight;

  return (
    <div className={cn('space-y-2', className)}>
      {showHints && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
          <button
            type="button"
            onClick={() => scrollBy('left')}
            disabled={!canScrollLeft}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/80 bg-card text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Scroll bracket left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Slide horizontally to view all rounds
          </p>
          <button
            type="button"
            onClick={() => scrollBy('right')}
            disabled={!canScrollRight}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/80 bg-card text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Scroll bracket right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="relative">
        {canScrollLeft && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[hsl(var(--surface-muted))] to-transparent"
            aria-hidden
          />
        )}
        {canScrollRight && (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[hsl(var(--surface-muted))] to-transparent"
            aria-hidden
          />
        )}
        <div ref={scrollRef} className="bracket-scroll-x overscroll-x-contain pb-1 -mx-1 px-1">
          {children}
        </div>
      </div>
    </div>
  );
}
