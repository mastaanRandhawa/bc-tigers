import type { CSSProperties } from 'react';
import type { Division } from '@/types';
import { BRAND_PRIMARY, BRAND_PRIMARY_HOVER, BRAND_PRIMARY_MUTED, BRAND_PRIMARY_MUTED_FG, DIVISION_PALETTE } from '@/lib/tokens';

export interface DivisionTheme {
  readonly primary: string;
  readonly primaryHover: string;
  readonly accent: string;
  readonly accentForeground: string;
  readonly shadow: string;
}

const DEFAULT_THEME: DivisionTheme = {
  primary: BRAND_PRIMARY,
  primaryHover: BRAND_PRIMARY_HOVER,
  accent: BRAND_PRIMARY_MUTED,
  accentForeground: BRAND_PRIMARY_MUTED_FG,
  shadow: BRAND_PRIMARY_HOVER,
};

function darkenHex(hex: string, amount = 0.15): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return hex;
  const r = Math.max(0, Math.round(parseInt(normalized.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(normalized.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(normalized.slice(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function paletteIndexFromSlug(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash + slug.charCodeAt(i) * (i + 1)) % DIVISION_PALETTE.length;
  }
  return hash;
}

export function getDivisionTheme(
  division: Pick<Division, 'slug' | 'primary_color' | 'accent_color'>,
): DivisionTheme {
  if (division.primary_color) {
    const primary = division.primary_color;
    const accent = division.accent_color ?? BRAND_PRIMARY_MUTED;
    const hover = darkenHex(primary);
    return {
      primary,
      primaryHover: hover,
      accent,
      accentForeground: hover,
      shadow: hover,
    };
  }

  return (DIVISION_PALETTE[paletteIndexFromSlug(division.slug)] as DivisionTheme) ?? DEFAULT_THEME;
}

export function divisionThemeStyle(theme: DivisionTheme): CSSProperties {
  return {
    '--division-primary': theme.primary,
    '--division-primary-hover': theme.primaryHover,
    '--division-accent': theme.accent,
    '--division-accent-fg': theme.accentForeground,
    '--division-shadow': theme.shadow,
  } as CSSProperties;
}
