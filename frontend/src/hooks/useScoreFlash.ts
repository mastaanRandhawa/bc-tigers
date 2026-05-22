import { useEffect, useRef, useState } from 'react';

/** Returns true briefly when score tuple changes */
export function useScoreFlash(home: number, away: number): boolean {
  const prev = useRef(`${home}-${away}`);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const key = `${home}-${away}`;
    if (prev.current !== key) {
      prev.current = key;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 450);
      return () => clearTimeout(t);
    }
  }, [home, away]);

  return flash;
}
