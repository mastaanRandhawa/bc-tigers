import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trophy, Flag, Shield, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { hubService } from '@/services/hub.service';
import { divisionBasePath } from '@/lib/division-routes';

interface SearchResult {
  id: string;
  label: string;
  sub?: string;
  href: string;
  group: 'Tournaments' | 'Divisions' | 'Teams';
  icon: typeof Trophy;
}

function buildResultsFromHub(
  data: Awaited<ReturnType<typeof hubService.search>>['data'],
): SearchResult[] {
  const results: SearchResult[] = [];

  for (const t of data.tournaments) {
    results.push({
      id: t.id,
      label: t.name,
      sub: t.location,
      href: `/tournaments/${t.slug}`,
      group: 'Tournaments',
      icon: Trophy,
    });
  }

  for (const d of data.divisions) {
    results.push({
      id: d.id,
      label: d.name,
      sub: d.tournament_name,
      href: divisionBasePath(d.tournament_slug, d.slug),
      group: 'Divisions',
      icon: Flag,
    });
  }

  for (const t of data.teams) {
    results.push({
      id: t.id,
      label: t.name,
      sub: t.city ?? t.division_slug,
      href: `${divisionBasePath(t.tournament_slug, t.division_slug)}/teams/${t.slug}`,
      group: 'Teams',
      icon: Shield,
    });
  }

  return results.slice(0, 20);
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const trimmed = query.trim();
  const { data: searchData } = useQuery({
    queryKey: ['hub', 'search', trimmed],
    queryFn: async () => (await hubService.search(trimmed)).data,
    enabled: trimmed.length >= 2,
  });

  const results = useMemo(
    () => (searchData ? buildResultsFromHub(searchData) : []),
    [searchData],
  );

  // Group results
  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const r of results) {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group)!.push(r);
    }
    return map;
  }, [results]);

  // Keyboard shortcut Cmd+K / Ctrl+K and /
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === '/' && document.activeElement === document.body) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handler);

    const openHandler = () => setOpen(true);
    window.addEventListener('open-global-search', openHandler);

    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('open-global-search', openHandler);
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  // Reset active index when results change
  useEffect(() => { setActiveIndex(0); }, [results]);

  const handleSelect = useCallback((href: string) => {
    navigate(href);
    setOpen(false);
    setQuery('');
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && results[activeIndex]) {
      handleSelect(results[activeIndex].href);
    }
  };

  if (!open) return null;

  let flatIndex = 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4"
      role="dialog"
      aria-label="Global search"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-popover shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tournaments, divisions, teams…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label="Search"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="shrink-0 hidden sm:flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto overscroll-contain py-1" role="listbox">
          {query.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Start typing to search…
            </p>
          ) : results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results for <span className="font-medium text-foreground">"{query}"</span>
            </p>
          ) : (
            Array.from(grouped.entries()).map(([group, items]) => (
              <div key={group}>
                <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group}
                </p>
                {items.map((result) => {
                  const idx = flatIndex++;
                  const Icon = result.icon;
                  return (
                    <button
                      key={result.id}
                      type="button"
                      role="option"
                      aria-selected={idx === activeIndex}
                      onClick={() => handleSelect(result.href)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        idx === activeIndex
                          ? 'bg-primary/10 text-foreground'
                          : 'text-foreground hover:bg-muted',
                      )}
                    >
                      <div className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                        idx === activeIndex ? 'bg-primary/20' : 'bg-muted',
                      )}>
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{result.label}</p>
                        {result.sub && (
                          <p className="text-xs text-muted-foreground truncate">{result.sub}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border px-4 py-2 flex items-center gap-3 text-[11px] text-muted-foreground/70">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> select</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

/** Call this to imperatively open the global search from anywhere. */
export function openGlobalSearch() {
  window.dispatchEvent(new Event('open-global-search'));
}
