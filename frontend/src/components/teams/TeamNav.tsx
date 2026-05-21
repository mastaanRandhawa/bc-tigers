import ResponsiveContextNav from '@/components/design-system/ResponsiveContextNav';
import type { SegmentedNavItem } from '@/components/design-system/SegmentedNav';
import type { DivisionTheme } from '@/lib/division-theme';
import type { TeamNavItem } from '@/components/layouts/TeamShell';

interface TeamNavProps {
  primaryItems?: TeamNavItem[];
  moreItems?: TeamNavItem[];
  allItems: TeamNavItem[];
  theme?: DivisionTheme;
}

/** @deprecated Shell uses ResponsiveContextNav directly */
export default function TeamNav({ allItems, theme }: TeamNavProps) {
  return (
    <ResponsiveContextNav
      items={allItems as SegmentedNavItem[]}
      theme={theme}
      ariaLabel="Team navigation"
      primaryCount={5}
    />
  );
}
