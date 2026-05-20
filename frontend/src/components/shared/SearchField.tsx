import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export default function SearchField({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  id,
  'aria-label': ariaLabel = 'Search',
}: SearchFieldProps) {
  return (
    <div className={cn('relative w-full max-w-md', className)}>
      <Search
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        aria-hidden
      />
      <Input
        id={id}
        type="search"
        role="searchbox"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10 pl-10"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
