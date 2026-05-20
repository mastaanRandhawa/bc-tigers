import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, TrendingUp } from 'lucide-react';
import { useLiveMatches } from '@/hooks/useMatches';
import { useStatsSummary } from '@/hooks/useStats';
import { useDivisions } from '@/hooks/useDivisions';

const ArrowGreenLeft = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full text-[#CCFF00] stroke-current overflow-visible" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10,90 C 10,40 40,20 60,50 C 70,65 80,75 95,70" />
    <path d="M80,55 L95,70 L85,85" />
  </svg>
);

const ArrowGreenRight = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full text-[#CCFF00] stroke-current overflow-visible" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M90,10 C 80,60 60,80 40,60 C 20,40 40,20 60,30 C 80,40 70,70 50,80" />
    <path d="M65,75 L50,80 L55,65" />
  </svg>
);

const ArrowBlack = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full text-black stroke-current overflow-visible" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20,80 Q 40,20 80,40" />
    <path d="M60,20 L80,40 L50,60" />
  </svg>
);

const CircularBadge = () => (
  <div className="relative w-28 h-28 md:w-36 md:h-36 bg-[#CCFF00] rounded-full flex items-center justify-center shadow-xl rotate-12 hover:scale-105 transition-transform cursor-pointer border-[3px] border-black/5">
    <div className="absolute inset-1 animate-[spin_10s_linear_infinite]">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path id="heroBadgeCircle" d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" fill="none" />
        <text style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase' }} fill="black">
          <textPath href="#heroBadgeCircle" startOffset="0%">
            BC TIGERS • BC TIGERS • BC TIGERS •
          </textPath>
        </text>
      </svg>
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <Trophy className="w-8 h-8 text-black" strokeWidth={2.5} />
    </div>
  </div>
);

interface LiveMatchCardProps {
  homeTeam: string;
  awayTeam: string;
  score: string;
  minute: number;
}

const LiveMatchCard = ({ homeTeam, awayTeam, score, minute }: LiveMatchCardProps) => (
  <div className="w-44 md:w-56 bg-white/20 backdrop-blur-md border border-white/40 rounded-[2rem] p-5 flex flex-col items-center justify-center shadow-2xl">
    <div className="flex items-center gap-1 mb-3">
      <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
      <span className="text-[10px] text-white/90 font-bold uppercase tracking-widest">LIVE {minute}&apos;</span>
    </div>
    <div className="text-center">
      <p className="text-xs text-white/70 font-medium">{homeTeam}</p>
      <p className="text-3xl font-black text-white my-1 tracking-tight">{score}</p>
      <p className="text-xs text-white/70 font-medium">{awayTeam}</p>
    </div>
  </div>
);

interface StatsCardProps {
  value: string;
  label: string;
}

const StatsCard = ({ value, label }: StatsCardProps) => (
  <div className="w-36 md:w-44 bg-white/20 backdrop-blur-md border border-white/40 rounded-[2rem] p-4 flex flex-col items-center justify-center shadow-2xl rotate-6 hover:rotate-0 transition-transform duration-500">
    <p className="text-2xl font-black text-[#CCFF00]">{value}</p>
    <p className="text-[10px] text-white/80 font-semibold uppercase tracking-wider mt-1">{label}</p>
  </div>
);

export const HeroComponent = () => {
  const { data: liveMatches = [] } = useLiveMatches();
  const { data: summary } = useStatsSummary();
  const { data: divisions = [] } = useDivisions();

  const featuredLive = liveMatches[0];
  const divisionLabels = divisions.slice(0, 4).map((d) => d.age_group ?? d.name.split(' ')[0]);

  return (
    <div className="min-h-dvh min-h-screen bg-[#0038FF] flex flex-col font-sans selection:bg-[#CCFF00] selection:text-black relative overflow-hidden w-full">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />

      <main className="flex-1 relative z-10 pt-6 pb-24 sm:pt-8 sm:pb-32 md:pt-16 md:pb-48 px-4 sm:px-6 flex flex-col items-center justify-center w-full max-w-[1440px] mx-auto landscape:py-8">
        <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center z-10 mt-2 sm:mt-4 mb-8 sm:mb-16">
          <div className="w-full flex flex-col items-center relative z-10 space-y-1 sm:space-y-2 md:space-y-4">
            <div className="w-full flex justify-start pl-[5%] sm:pl-[10%] md:pl-[20%] relative z-30">
              <h1
                className="text-[clamp(3.5rem,10vw,140px)] font-black leading-[0.85] tracking-tighter text-[#CCFF00] m-0 p-0 uppercase"
                style={{
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  textShadow: '1px 1px 0 #001A99, 2px 2px 0 #001A99, 3px 3px 0 #001A99, 4px 4px 0 #001A99, 5px 5px 0 #001A99, 6px 6px 0 #001A99, 8px 8px 0 #001A99, 10px 10px 0 #001A99',
                }}
              >
                #BC
              </h1>
            </div>
            <div className="w-full flex justify-center relative z-20">
              <h1
                className="text-[clamp(4rem,14vw,200px)] font-black leading-[0.85] tracking-tighter text-white m-0 p-0 uppercase"
                style={{
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  textShadow: '1px 1px 0 #001A99, 2px 2px 0 #001A99, 3px 3px 0 #001A99, 4px 4px 0 #001A99, 5px 5px 0 #001A99, 6px 6px 0 #001A99, 8px 8px 0 #001A99, 10px 10px 0 #001A99, 12px 12px 0 #001A99, 14px 14px 0 #001A99',
                }}
              >
                TIGERS
              </h1>
            </div>
            <div className="w-full flex justify-end pr-[5%] sm:pr-[10%] md:pr-[20%] relative z-10">
              <h1
                className="text-[clamp(3rem,8vw,120px)] font-black leading-[0.85] tracking-tighter text-white m-0 p-0 uppercase"
                style={{
                  fontFamily: '"Arial Black", Impact, sans-serif',
                  textShadow: '1px 1px 0 #001A99, 2px 2px 0 #001A99, 3px 3px 0 #001A99, 4px 4px 0 #001A99, 5px 5px 0 #001A99, 6px 6px 0 #001A99, 8px 8px 0 #001A99',
                }}
              >
                SOCCER
              </h1>
            </div>
          </div>

          <p className="mt-4 sm:mt-6 text-white/70 text-sm md:text-base font-medium max-w-md z-30 px-2">
            British Columbia&apos;s premier soccer tournament management platform. Live scores, standings, brackets &amp; more.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8 z-30 w-full sm:w-auto max-w-sm sm:max-w-none px-4 sm:px-0">
            <Link
              to="/tournaments"
              className="w-full sm:w-auto text-center px-8 py-3 rounded-full bg-[#CCFF00] text-black font-bold text-sm hover:bg-yellow-300 transition-colors shadow-lg"
            >
              View Tournaments
            </Link>
            <Link
              to="/schedule"
              className="w-full sm:w-auto text-center px-8 py-3 rounded-full border border-white text-white font-bold text-sm hover:bg-white hover:text-[#0038FF] transition-colors"
            >
              Schedule
            </Link>
          </div>

          {/* Mobile / tablet inline stats (replaces floating cards on small screens) */}
          <div className="flex flex-wrap justify-center gap-3 mt-6 lg:hidden z-30 w-full max-w-md">
            {featuredLive && (
              <LiveMatchCard
                homeTeam={featuredLive.home_team?.name ?? 'Home'}
                awayTeam={featuredLive.away_team?.name ?? 'Away'}
                score={`${featuredLive.home_score}-${featuredLive.away_score}`}
                minute={67}
              />
            )}
            {summary && <StatsCard value={String(summary.teams)} label="Teams" />}
          </div>

          <div className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block">
            {featuredLive && (
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-[5%] left-[2%] md:left-[15%] z-30 pointer-events-auto rotate-[-8deg]"
              >
                <LiveMatchCard
                  homeTeam={featuredLive.home_team?.name ?? 'Home'}
                  awayTeam={featuredLive.away_team?.name ?? 'Away'}
                  score={`${featuredLive.home_score}-${featuredLive.away_score}`}
                  minute={67}
                />
              </motion.div>
            )}

            {summary && (
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute top-[10%] right-[2%] md:right-[18%] z-30 pointer-events-auto"
              >
                <StatsCard value={String(summary.teams)} label="Teams" />
              </motion.div>
            )}

            <div className="absolute bottom-[0%] left-[0%] md:left-[8%] w-16 h-16 md:w-32 md:h-32 z-20 hidden md:block">
              <ArrowGreenLeft />
            </div>
            <div className="absolute top-[5%] right-[0%] md:right-[8%] w-16 h-16 md:w-32 md:h-32 z-20 hidden md:block">
              <ArrowGreenRight />
            </div>
            <div className="absolute bottom-[-8%] right-[0%] md:right-[12%] z-40 pointer-events-auto hidden md:block">
              <CircularBadge />
            </div>
          </div>
        </div>
      </main>

      <section className="bg-white text-black rounded-t-[2rem] sm:rounded-t-[2.5rem] md:rounded-t-[3.5rem] px-4 sm:px-6 py-10 sm:py-12 md:px-10 md:py-16 relative z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.2)] mt-auto w-full safe-b">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <div className="bg-[#F8F9FA] rounded-[2rem] p-6 sm:p-8 flex flex-col items-center text-center relative min-h-[14rem] sm:min-h-[16rem] border border-gray-100">
            <Calendar className="w-8 h-8 text-[#0038FF] mb-3" />
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black">
              LIVE<br />SCHEDULES
            </h3>
            <p className="text-[10px] md:text-xs text-black/60 font-bold mb-auto">
              Real-time fixtures, results and standings updated instantly
            </p>
            <div className="flex items-center bg-[#0038FF] rounded-2xl p-2 pr-4 text-white shadow-lg mt-4">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse mr-2 ml-1" />
              <span className="text-xs font-bold">
                {summary?.live_matches ?? 0} Match{(summary?.live_matches ?? 0) === 1 ? '' : 'es'} LIVE Now
              </span>
            </div>
          </div>

          <div className="bg-[#F8F9FA] rounded-[2rem] p-6 sm:p-8 flex flex-col items-center text-center relative min-h-[14rem] sm:min-h-[16rem] border border-gray-100 sm:col-span-2 md:col-span-1">
            <Trophy className="w-8 h-8 text-[#0038FF] mb-3" />
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black">
              MULTI<br />DIVISION
            </h3>
            <p className="text-[10px] md:text-xs text-black/60 font-bold mb-auto">
              U10, U14, Premier, Open — every age group and skill level
            </p>
            <div className="flex gap-2 mt-4 flex-wrap justify-center">
              {(divisionLabels.length > 0 ? divisionLabels : ['U10', 'U14', 'Premier', 'Open']).map((d) => (
                <span key={d} className="bg-[#CCFF00] text-black text-[10px] font-black px-2 py-1 rounded-lg">{d}</span>
              ))}
            </div>
          </div>

          <div className="bg-[#F8F9FA] rounded-[2rem] p-6 sm:p-8 flex flex-col items-center text-center relative min-h-[14rem] sm:min-h-[16rem] border border-gray-100 sm:col-span-2 md:col-span-1">
            <TrendingUp className="w-8 h-8 text-[#0038FF] mb-3" />
            <h3 className="text-xl md:text-2xl uppercase leading-tight mb-2 font-black">
              PLAYER<br />STATS
            </h3>
            <p className="text-[10px] md:text-xs text-black/60 font-bold mb-auto">
              Top scorers, assists, discipline and full player profiles
            </p>
            {summary?.top_scorer && (
              <div className="flex flex-col items-center bg-[#CCFF00] rounded-[2rem] px-6 py-3 text-black shadow-lg mt-4 relative w-full max-w-[180px]">
                <p className="text-[9px] font-bold uppercase tracking-wider mb-1">TOP SCORER</p>
                <p className="text-lg font-black">{summary.top_scorer.goals} Goals</p>
                <p className="text-[10px] font-semibold truncate max-w-full">{summary.top_scorer.name}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HeroComponent;
