import SegmentedNav, {
  type SegmentedNavItem,
} from '@/components/design-system/SegmentedNav';
import type { DivisionTheme } from '@/lib/division-theme';

/** @deprecated Use SegmentedNav from design-system */
export type PillNavItem = SegmentedNavItem;

interface PillNavProps {
  items: PillNavItem[];
  theme?: DivisionTheme;
  ariaLabel?: string;
  className?: string;
}

export default function PillNav(props: PillNavProps) {
  return <SegmentedNav {...props} />;
}
