/** Centralized motion tokens — use everywhere for consistent feel */

export const duration = {
  fast: 0.15,
  normal: 0.22,
  slow: 0.32,
} as const;

export const durationMs = {
  fast: 150,
  normal: 220,
  slow: 320,
} as const;

export const ease = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.4, 0, 0.2, 1] as const,
};

export const spring = {
  soft: { type: 'spring' as const, stiffness: 260, damping: 28 },
  snappy: { type: 'spring' as const, stiffness: 400, damping: 32 },
};

export const stagger = {
  fast: 0.04,
  normal: 0.06,
  slow: 0.08,
} as const;
