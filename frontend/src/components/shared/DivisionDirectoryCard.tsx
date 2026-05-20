import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
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
      className="group block rounded-[2rem] border-2 border-gray-200 bg-white hover:shadow-lg transition-all p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-black uppercase text-foreground group-hover:text-primary">
            {division.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {description ?? division.tournament?.name}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary shrink-0" />
      </div>
    </Link>
  );
}
