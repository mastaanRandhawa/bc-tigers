import { Link } from 'react-router-dom';
import type { PlayerStat } from '@/types';

type StatField = 'goals' | 'assists' | 'yellow_cards' | 'red_cards';

interface StatsLeaderboardProps {
  stats: PlayerStat[];
  statField: StatField;
  statLabel: string;
}

export default function StatsLeaderboard({ stats, statField, statLabel }: StatsLeaderboardProps) {
  const sorted = [...stats].sort((a, b) => (b[statField] ?? 0) - (a[statField] ?? 0));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-5 py-3 font-semibold text-gray-500">#</th>
            <th className="text-left px-5 py-3 font-semibold text-gray-500">Player</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-500">MP</th>
            <th className="text-center px-4 py-3 font-bold text-gray-700">{statLabel}</th>
            {statField !== 'goals' && statField !== 'assists' && (
              <>
                <th className="text-center px-4 py-3 font-semibold text-gray-500">YC</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-500">RC</th>
              </>
            )}
            {statField === 'goals' && (
              <th className="text-center px-4 py-3 font-semibold text-gray-500">Assists</th>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((stat, i) => (
            <tr key={stat.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    i === 0 ? 'bg-[#CCFF00] text-black' : 'text-gray-400'
                  }`}
                >
                  {i + 1}
                </span>
              </td>
              <td className="px-5 py-3">
                {stat.player ? (
                  <Link to={`/players/${stat.player.slug}`} className="hover:text-[#0038FF] transition-colors">
                    <p className="font-bold text-gray-900">
                      {stat.player.first_name} {stat.player.last_name}
                    </p>
                    <p className="text-xs text-gray-400">{stat.team?.name}</p>
                  </Link>
                ) : (
                  '—'
                )}
              </td>
              <td className="text-center px-4 py-3 text-gray-600">{stat.matches_played}</td>
              <td className="text-center px-4 py-3 font-black text-[#0038FF] text-lg">
                {stat[statField]}
              </td>
              {statField === 'goals' && (
                <td className="text-center px-4 py-3 text-gray-500">{stat.assists}</td>
              )}
              {statField !== 'goals' && statField !== 'assists' && (
                <>
                  <td className="text-center px-4 py-3 text-yellow-600">{stat.yellow_cards}</td>
                  <td className="text-center px-4 py-3 text-red-600">{stat.red_cards}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
