import { Link } from 'react-router-dom';
import { ChevronRight, Flag } from 'lucide-react';
import { getDivisionBasePath } from '@/lib/division-routes';
import type { Division } from '@/types';

interface DivisionDirectoryCardProps {
  division: Division;
  description?: string;
}

export default function DivisionDirectoryCard({
  division,
  description,
}: DivisionDirectoryCardProps) {
  const href = getDivisionBasePath(division);
  if (!href) return null;

  return (
    <Link
      to={href}
      className="group flex items-center gap-4 rounded-xl border border-border bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-px"
    >
      <div className="w-10 h-10 rounded-lg bg-primary-muted flex items-center justify-center shrink-0 border border-primary/10">
        <Flag className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
          {division.name}
        </h3>
        <p className="text-sm text-zinc-500 mt-0.5 truncate">
          {description ?? division.tournament?.name}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {division.age_group && (
            <span className="text-xs text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded-md border border-border">
              {division.age_group}
            </span>
          )}
          <span className="text-xs text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded-md border border-border">
            {division.format}
          </span>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-primary shrink-0 transition-colors" />
    </Link>
  );
}
