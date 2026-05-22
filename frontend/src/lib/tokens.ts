/**
 * Design tokens — single TS-side source of truth for brand values.
 *
 * CSS-side tokens live in index.css (@theme inline block).
 * Use these only when JS/TS logic needs the raw hex values
 * (e.g. runtime CSS variable injection, canvas rendering, color math).
 *
 * For styling components always prefer Tailwind utility classes
 * (bg-primary, text-primary, etc.) which reference the CSS tokens.
 */

export const BRAND_PRIMARY = '#F48735' as const;
export const BRAND_PRIMARY_HOVER = '#D66E1F' as const;
export const BRAND_PRIMARY_MUTED = '#FEF3EB' as const;
export const BRAND_PRIMARY_MUTED_FG = '#D66E1F' as const;

/** Fallback division palette (used when a division has no custom primary_color) */
export const DIVISION_PALETTE = [
  {
    primary: BRAND_PRIMARY,
    primaryHover: BRAND_PRIMARY_HOVER,
    accent: BRAND_PRIMARY_MUTED,
    accentForeground: BRAND_PRIMARY_MUTED_FG,
    shadow: BRAND_PRIMARY_HOVER,
  },
  {
    primary: '#7C3AED',
    primaryHover: '#6D28D9',
    accent: '#F3E8FF',
    accentForeground: '#6D28D9',
    shadow: '#6D28D9',
  },
  {
    primary: '#059669',
    primaryHover: '#047857',
    accent: '#ECFDF5',
    accentForeground: '#047857',
    shadow: '#047857',
  },
  {
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    accent: '#EFF6FF',
    accentForeground: '#1D4ED8',
    shadow: '#1D4ED8',
  },
] as const;

/** Standard Motion animation presets (used with the `motion` library) */
export const TRANSITIONS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2 },
  },
  slideUp: {
    initial: { y: 8, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.2 },
  },
  slideDown: {
    initial: { y: -8, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.2 },
  },
  scaleIn: {
    initial: { scale: 0.97, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.15 },
  },
} as const;
