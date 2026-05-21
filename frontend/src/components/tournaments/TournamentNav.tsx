import ResponsiveContextNav from '@/components/design-system/ResponsiveContextNav';
import type { SegmentedNavItem } from '@/components/design-system/SegmentedNav';
import type { TournamentNavItem } from '@/components/layouts/TournamentShell';

interface TournamentNavProps {
  primaryItems?: TournamentNavItem[];
  moreItems?: TournamentNavItem[];
  allItems: TournamentNavItem[];
}

/** @deprecated Shell uses ResponsiveContextNav directly */
export default function TournamentNav({ allItems }: TournamentNavProps) {
  return <ResponsiveContextNav items={allItems as SegmentedNavItem[]} ariaLabel="Tournament navigation" />;
}
