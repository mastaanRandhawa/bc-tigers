import { useEffect, useState } from 'react';

/** Tracks vertical scroll offset; useful for sticky header shadow */
export function useScrollY(threshold = 8): { scrollY: number; isScrolled: boolean } {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { scrollY, isScrolled: scrollY > threshold };
}
