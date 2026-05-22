import { useEffect, useRef, useState } from 'react';

/** Brief flash when a scalar value changes */
export function useValueFlash(value: string | number): boolean {
  const prev = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 450);
      return () => clearTimeout(t);
    }
  }, [value]);

  return flash;
}
