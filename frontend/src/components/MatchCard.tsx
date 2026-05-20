import { Link } from 'react-router-dom';
import { MapPin, Clock, User } from 'lucide-react';
import type { Match } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';

interface MatchCardProps {
  match: Match;
  compact?: boolean;
}

export default function MatchCard({ match, compact = false }: MatchCardProps) {
  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';
  const showScore = isLive || isCompleted;

  if (compact) {
    return (
      <Link to={`/matches/${match.id}`} className="block group min-w-0">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 py-2 rounded-lg hover:bg-gray-50 transition-colors min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate text-right min-w-0">
            {match.home_team?.name ?? 'TBD'}
          </p>
          <div className="shrink-0 text-center px-1">
            {showScore ? (
              <span className={`text-sm font-black whitespace-nowrap ${isLive ? 'text-red-600' : 'text-gray-900'}`}>
                {match.home_score} – {match.away_score}
              </span>
            ) : (
              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                {formatTime(match.scheduled_start)}
              </span>
            )}
            {isLive && (
              <span className="text-[9px] text-red-500 font-bold uppercase animate-pulse block">LIVE</span>
            )}
          </div>
          <p className="text-sm font-bold text-gray-900 truncate text-left min-w-0">
            {match.away_team?.name ?? 'TBD'}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/matches/${match.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5">
        {/* Status + Date */}
        <div className="flex items-center justify-between mb-4">
          <Badge variant={isLive ? 'live' : isCompleted ? 'success' : 'default'} className={getStatusColor(match.status)}>
            {isLive ? '● LIVE' : match.status}
          </Badge>
          <span className="text-xs text-gray-400 font-medium">{formatDate(match.scheduled_start)}</span>
        </div>

        {/* Teams + Score */}
        <div className="flex items-center gap-4">
          {/* Home Team */}
          <div className="flex-1 text-right">
            {match.home_team?.logo && (
              <img src={match.home_team.logo} alt={match.home_team.name} className="w-10 h-10 rounded-full object-cover ml-auto mb-1" />
            )}
            <p className="font-bold text-gray-900 text-sm">{match.home_team?.name ?? 'TBD'}</p>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center min-w-[80px]">
            {showScore ? (
              <div className={`text-3xl font-black tracking-tight ${isLive ? 'text-red-600' : 'text-gray-900'}`}>
                {match.home_score} <span className="text-gray-300">–</span> {match.away_score}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-lg font-black text-gray-300">VS</p>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">{formatTime(match.scheduled_start)}</p>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 text-left">
            {match.away_team?.logo && (
              <img src={match.away_team.logo} alt={match.away_team.name} className="w-10 h-10 rounded-full object-cover mr-auto mb-1" />
            )}
            <p className="font-bold text-gray-900 text-sm">{match.away_team?.name ?? 'TBD'}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
          {match.venue && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {match.venue.name}
            </span>
          )}
          {match.round !== undefined && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> Round {match.round}
            </span>
          )}
          {match.referee && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" /> {match.referee.first_name} {match.referee.last_name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
