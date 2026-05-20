import { Link } from 'react-router-dom';
import { MapPin, Clock, User } from 'lucide-react';
import type { Match } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatTime, getMatchStatusBadgeVariant } from '@/lib/utils';

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
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 py-2 rounded-lg hover:bg-muted transition-colors min-w-0">
          <p className="text-sm font-semibold text-foreground truncate text-right min-w-0">
            {match.home_team?.name ?? 'TBD'}
          </p>
          <div className="shrink-0 text-center px-1">
            {showScore ? (
              <span className={`text-sm font-bold whitespace-nowrap ${isLive ? 'text-red-600' : 'text-foreground'}`}>
                {match.home_score} – {match.away_score}
              </span>
            ) : (
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {formatTime(match.scheduled_start)}
              </span>
            )}
            {isLive && (
              <span className="text-[9px] text-red-500 font-bold uppercase animate-pulse block">Live</span>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground truncate text-left min-w-0">
            {match.away_team?.name ?? 'TBD'}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/matches/${match.id}`} className="block group">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <Badge variant={getMatchStatusBadgeVariant(match.status)}>
              {isLive ? '● LIVE' : match.status}
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">{formatDate(match.scheduled_start)}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 text-right min-w-0">
              {match.home_team?.logo && (
                <img src={match.home_team.logo} alt="" className="w-10 h-10 rounded-full object-cover ml-auto mb-1" />
              )}
              <p className="font-semibold text-foreground text-sm truncate">{match.home_team?.name ?? 'TBD'}</p>
            </div>

            <div className="flex flex-col items-center min-w-[80px] shrink-0">
              {showScore ? (
                <div className={`text-2xl font-bold tracking-tight ${isLive ? 'text-red-600' : 'text-foreground'}`}>
                  {match.home_score} <span className="text-muted-foreground">–</span> {match.away_score}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-base font-bold text-muted-foreground">VS</p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">{formatTime(match.scheduled_start)}</p>
                </div>
              )}
            </div>

            <div className="flex-1 text-left min-w-0">
              {match.away_team?.logo && (
                <img src={match.away_team.logo} alt="" className="w-10 h-10 rounded-full object-cover mr-auto mb-1" />
              )}
              <p className="font-semibold text-foreground text-sm truncate">{match.away_team?.name ?? 'TBD'}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
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
        </CardContent>
      </Card>
    </Link>
  );
}
