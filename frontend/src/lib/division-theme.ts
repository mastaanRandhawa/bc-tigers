import type { CSSProperties } from 'react';
import type { Division } from '@/types';

export interface DivisionTheme {
  primary: string;
  primaryHover: string;
  accent: string;
  accentForeground: string;
  shadow: string;
}

const DEFAULT_THEME: DivisionTheme = {
  primary: '#F48735',
  primaryHover: '#D66E1F',
  accent: '#FEF3EB',
  accentForeground: '#D66E1F',
  shadow: '#D66E1F',
};

const FALLBACK_PALETTE: DivisionTheme[] = [
  DEFAULT_THEME,
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
];

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
    hash = (hash + slug.charCodeAt(i) * (i + 1)) % FALLBACK_PALETTE.length;
  }
  return hash;
}

export function getDivisionTheme(division: Pick<Division, 'slug' | 'primary_color' | 'accent_color'>): DivisionTheme {
  if (division.primary_color) {
    const primary = division.primary_color;
    const accent = division.accent_color ?? '#FEF3EB';
    const hover = darkenHex(primary);
    return {
      primary,
      primaryHover: hover,
      accent,
      accentForeground: hover,
      shadow: hover,
    };
  }

  return FALLBACK_PALETTE[paletteIndexFromSlug(division.slug)] ?? DEFAULT_THEME;
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
