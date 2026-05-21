/** Bauhaus Sports Modernism — centralized design tokens */
export const BAUHAUS = {
  brand: '#F48735',
  brandDark: '#D66E1F',
  red: '#D02020',
  blue: '#1040C0',
  yellow: '#F0C020',
  background: '#F0F0F0',
  foreground: '#121212',
  muted: '#E0E0E0',
  white: '#FFFFFF',
  charcoal: '#1A1A1A',
} as const;

export const SHADOW = {
  sm: '4px 4px 0px 0px #121212',
  md: '8px 8px 0px 0px #121212',
  lg: '12px 12px 0px 0px #121212',
  brand: '6px 6px 0px 0px #F48735',
} as const;

export const MOTION = {
  fast: '200ms',
  base: '300ms',
  ease: 'cubic-bezier(0, 0, 0.2, 1)',
} as const;

export const BORDER = {
  mobile: '2px',
  desktop: '4px',
} as const;
