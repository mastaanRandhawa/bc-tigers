import { BAUHAUS } from './design-tokens';

export const BRAND = {
  primary: BAUHAUS.brand,
  primaryHover: BAUHAUS.brandDark,
  primaryMuted: '#FFE8D4',
  accent: BAUHAUS.white,
  shadow: BAUHAUS.foreground,
  red: BAUHAUS.red,
  blue: BAUHAUS.blue,
  yellow: BAUHAUS.yellow,
} as const;
