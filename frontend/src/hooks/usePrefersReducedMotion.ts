import { useReducedMotion } from 'motion/react';

/** True when user prefers reduced motion — skip decorative animations */
export function usePrefersReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}
