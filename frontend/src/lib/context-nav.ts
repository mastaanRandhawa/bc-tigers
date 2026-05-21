import type { LucideIcon } from 'lucide-react';
import type { SegmentedNavItem } from '@/components/design-system/SegmentedNav';

export type ContextNavItem = SegmentedNavItem & { icon: LucideIcon };

export function splitContextNavItems(items: ContextNavItem[], primaryCount = 5) {
  return {
    primary: items.slice(0, primaryCount),
    more: items.slice(primaryCount),
  };
}

export function isContextNavActive(pathname: string, href: string, end?: boolean) {
  if (end) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
