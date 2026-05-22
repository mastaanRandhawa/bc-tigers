import { useEffect, useRef, useState } from 'react';
import { m } from 'motion/react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

/** Brief highlight when score/value changes */
export function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  const reduced = usePrefersReducedMotion();
  const prev = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      if (!reduced) {
        setFlash(true);
        const t = setTimeout(() => setFlash(false), 400);
        return () => clearTimeout(t);
      }
    }
  }, [value, reduced]);

  if (reduced) {
    return <span className={cn('tabular-nums', className)}>{value}</span>;
  }

  return (
    <m.span
      className={cn('tabular-nums inline-block', className)}
      animate={
        flash
          ? { scale: [1, 1.08, 1], color: ['inherit', 'hsl(var(--primary))', 'inherit'] }
          : { scale: 1 }
      }
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {value}
    </m.span>
  );
}
