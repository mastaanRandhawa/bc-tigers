import { cn } from '@/lib/utils';

interface RosterPlayerRowProps {
  number: number;
  name: string;
  accentColor?: string;
}

export default function RosterPlayerRow({ number, name, accentColor }: RosterPlayerRowProps) {
  return (
    <div className="group flex items-baseline gap-2 border-b border-white/8 py-1 transition-colors hover:border-white/25">
      <span
        className="w-6 shrink-0 text-right text-xs font-black tabular-nums text-white/60 group-hover:text-white/90"
        style={accentColor ? { color: accentColor } : undefined}
      >
        {number || '–'}
      </span>
      <span className="min-w-0 truncate text-xs font-bold uppercase tracking-wide text-white/95">
        {name}
      </span>
    </div>
  );
}
