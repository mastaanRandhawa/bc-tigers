import { useLiveMatches } from '@/hooks/useMatches';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function LiveScoreTicker() {
  const { data: liveMatches = [] } = useLiveMatches();

  if (liveMatches.length === 0) return null;

  return (
    <div className="bg-red-600 text-white py-2 overflow-hidden safe-x">
      <div className="flex items-center gap-3 sm:gap-4 max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1.5 flex-shrink-0 bg-red-700 px-3 py-1 rounded-full">
          <Zap className="w-3.5 h-3.5 text-yellow-300" />
          <span className="text-xs font-black uppercase tracking-wider">LIVE</span>
        </div>
        <div className="flex gap-6 overflow-x-auto no-scrollbar">
          {liveMatches.map((match) => (
            <Link
              key={match.id}
              to={`/matches/${match.id}`}
              className="flex items-center gap-2 whitespace-nowrap hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <span className="text-sm font-semibold">{match.home_team?.name ?? 'Home'}</span>
              <span className="font-black text-base bg-red-800 px-2 py-0.5 rounded-lg">
                {match.home_score} – {match.away_score}
              </span>
              <span className="text-sm font-semibold">{match.away_team?.name ?? 'Away'}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
