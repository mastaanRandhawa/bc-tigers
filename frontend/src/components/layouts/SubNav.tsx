import PillNav, { type PillNavItem } from '@/components/shared/PillNav';

export type { PillNavItem as SubNavItem };

interface SubNavProps {
  items: PillNavItem[];
  label?: string;
}

export default function SubNav({ items, label }: SubNavProps) {
  return (
    <div className="border-b border-border bg-card">
      {label && (
        <div className="page-container pt-3">
          <p className="text-label m-0">{label}</p>
        </div>
      )}
      <div className="py-2.5">
        <PillNav items={items} ariaLabel={label ?? 'Section navigation'} />
      </div>
    </div>
  );
}
