import ResponsiveContextNav from '@/components/design-system/ResponsiveContextNav';
import type { SegmentedNavItem } from '@/components/design-system/SegmentedNav';
import type { DivisionTheme } from '@/lib/division-theme';
import type { DivisionNavItem } from '@/components/layouts/DivisionShell';

interface DivisionNavProps {
  primaryItems?: DivisionNavItem[];
  moreItems?: DivisionNavItem[];
  allItems: DivisionNavItem[];
  theme?: DivisionTheme;
}

/** @deprecated Shell uses ResponsiveContextNav directly */
export default function DivisionNav({ allItems, theme }: DivisionNavProps) {
  return (
    <ResponsiveContextNav
      items={allItems as SegmentedNavItem[]}
      theme={theme}
      ariaLabel="Division navigation"
      primaryCount={5}
    />
  );
}
