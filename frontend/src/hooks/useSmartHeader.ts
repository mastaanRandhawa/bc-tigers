import { useEffect, useRef, useState } from 'react';

interface UseSmartHeaderOptions {
  /** Always show header when scroll is within this distance from top */
  topThreshold?: number;
  /** Cumulative scroll-down (px) before hiding */
  hideAfterScroll?: number;
  /** Cumulative scroll-up (px) before showing again */
  showAfterScroll?: number;
  /** Minimum time between show/hide toggles (ms) — prevents flicker */
  minToggleInterval?: number;
}

function getScrollY(): number {
  return (
    window.scrollY ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0
  );
}

/**
 * Auto-hiding header: visible at top, hides after sustained scroll down,
 * reappears after sustained scroll up. Uses accumulated distance to avoid flicker.
 */
export function useSmartHeader(options: UseSmartHeaderOptions = {}) {
  const topThreshold = options.topThreshold ?? 24;
  const hideAfterScroll = options.hideAfterScroll ?? 80;
  const showAfterScroll = options.showAfterScroll ?? 56;
  const minToggleInterval = options.minToggleInterval ?? 280;

  const [scrollY, setScrollY] = useState(0);
  const [visible, setVisible] = useState(true);

  const lastY = useRef(0);
  const accumulated = useRef(0);
  const lastToggleAt = useRef(0);
  const visibleRef = useRef(true);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    const tryToggle = (next: boolean): boolean => {
      if (next === visibleRef.current) return false;
      const now = performance.now();
      if (now - lastToggleAt.current < minToggleInterval) return false;
      lastToggleAt.current = now;
      visibleRef.current = next;
      setVisible(next);
      return true;
    };

    const update = () => {
      const y = getScrollY();
      const delta = y - lastY.current;
      lastY.current = y;
      setScrollY(y);

      if (y <= topThreshold) {
        accumulated.current = 0;
        tryToggle(true);
        return;
      }

      if (delta === 0) return;

      if (delta > 0) {
        // Scrolling down — reset upward accumulator
        if (accumulated.current < 0) accumulated.current = 0;
        accumulated.current += delta;
        if (accumulated.current >= hideAfterScroll && tryToggle(false)) {
          accumulated.current = 0;
        }
        return;
      }

      // Scrolling up — reset downward accumulator
      if (accumulated.current > 0) accumulated.current = 0;
      accumulated.current += delta;
      if (accumulated.current <= -showAfterScroll && tryToggle(true)) {
        accumulated.current = 0;
      }
    };

    lastY.current = getScrollY();
    setScrollY(lastY.current);

    window.addEventListener('scroll', update, { passive: true });
    document.addEventListener('scroll', update, { passive: true });
    update();

    return () => {
      window.removeEventListener('scroll', update);
      document.removeEventListener('scroll', update);
    };
  }, [topThreshold, hideAfterScroll, showAfterScroll, minToggleInterval]);

  return {
    scrollY,
    isVisible: visible,
    isAtTop: scrollY <= topThreshold,
    isScrolled: scrollY > topThreshold,
  };
}
