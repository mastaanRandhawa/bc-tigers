import { Link } from 'react-router-dom';
import type { Standing } from '@/types';
import { getFormColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface StandingsTableProps {
  standings: Standing[];
  compact?: boolean;
}

export default function StandingsTable({ standings, compact = false }: StandingsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm -mx-4 sm:mx-0 px-4 sm:px-0">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 font-semibold text-gray-500 w-8">#</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500">Team</th>
            <th className="text-center px-3 py-3 font-semibold text-gray-500">P</th>
            <th className="text-center px-3 py-3 font-semibold text-gray-500">W</th>
            <th className="text-center px-3 py-3 font-semibold text-gray-500">D</th>
            <th className="text-center px-3 py-3 font-semibold text-gray-500">L</th>
            {!compact && (
              <>
                <th className="text-center px-3 py-3 font-semibold text-gray-500">GF</th>
                <th className="text-center px-3 py-3 font-semibold text-gray-500">GA</th>
              </>
            )}
            <th className="text-center px-3 py-3 font-semibold text-gray-500">GD</th>
            <th className="text-center px-3 py-3 font-bold text-gray-700">Pts</th>
            {!compact && <th className="text-center px-3 py-3 font-semibold text-gray-500">Form</th>}
          </tr>
        </thead>
        <tbody>
          {standings.map((s, idx) => (
            <tr
              key={s.id}
              className={cn(
                'border-b border-gray-50 hover:bg-gray-50 transition-colors',
                idx === 0 && 'bg-blue-50/50',
                idx < 3 && idx > 0 && 'bg-green-50/30'
              )}
            >
              <td className="px-4 py-3 text-gray-500 font-medium">{s.rank}</td>
              <td className="px-4 py-3">
                {s.team ? (
                  <Link
                    to={`/teams/${s.team.slug}`}
                    className="flex items-center gap-2 hover:text-[#0038FF] transition-colors"
                  >
                    {s.team.logo && (
                      <img src={s.team.logo} alt={s.team.name} className="w-6 h-6 rounded-full object-cover" />
                    )}
                    <span className="font-semibold text-gray-900">{s.team.name}</span>
                    {idx === 0 && (
                      <span className="text-[10px] bg-[#CCFF00] text-black font-bold px-1.5 py-0.5 rounded-full">Leader</span>
                    )}
                  </Link>
                ) : (
                  <span className="text-gray-400">Unknown</span>
                )}
              </td>
              <td className="text-center px-3 py-3 text-gray-700">{s.played}</td>
              <td className="text-center px-3 py-3 text-green-700 font-semibold">{s.wins}</td>
              <td className="text-center px-3 py-3 text-yellow-600 font-semibold">{s.draws}</td>
              <td className="text-center px-3 py-3 text-red-600 font-semibold">{s.losses}</td>
              {!compact && (
                <>
                  <td className="text-center px-3 py-3 text-gray-700">{s.goals_for}</td>
                  <td className="text-center px-3 py-3 text-gray-700">{s.goals_against}</td>
                </>
              )}
              <td className={cn('text-center px-3 py-3 font-semibold', s.goal_difference > 0 ? 'text-green-600' : s.goal_difference < 0 ? 'text-red-600' : 'text-gray-500')}>
                {s.goal_difference > 0 ? '+' : ''}{s.goal_difference}
              </td>
              <td className="text-center px-3 py-3 font-black text-[#0038FF] text-base">{s.points}</td>
              {!compact && (
                <td className="text-center px-3 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {s.form?.map((f, i) => (
                      <span
                        key={i}
                        className={cn('w-5 h-5 rounded-full text-[9px] font-black text-white flex items-center justify-center', getFormColor(f))}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
