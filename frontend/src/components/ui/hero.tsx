import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Calendar, MapPin, Trophy } from "lucide-react";
import { useLiveMatches } from "@/hooks/useMatches";
import { useTournaments } from "@/hooks/useTournaments";
import { formatDate } from "@/lib/date";
import {
  pickFeaturedTournament,
  tournamentOverviewPath,
} from "@/lib/featured-tournament";
import { cn } from "@/lib/utils";
import { getMatchPath } from "@/lib/division-routes";
import type { Match } from "@/types";

const ArrowAccentLeft = () => (
  <svg
    viewBox="0 0 100 100"
    className="w-full h-full text-white stroke-current overflow-visible"
    fill="none"
    strokeWidth="6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10,90 C 10,40 40,20 60,50 C 70,65 80,75 95,70" />
    <path d="M80,55 L95,70 L85,85" />
  </svg>
);

const ArrowAccentRight = () => (
  <svg
    viewBox="0 0 100 100"
    className="w-full h-full text-primary-muted stroke-current overflow-visible"
    fill="none"
    strokeWidth="6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M90,10 C 80,60 60,80 40,60 C 20,40 40,20 60,30 C 80,40 70,70 50,80" />
    <path d="M65,75 L50,80 L55,65" />
  </svg>
);

function CircularBadge({
  schedulePath,
  className,
}: {
  schedulePath: string;
  className?: string;
}) {
  return (
    <Link
      to={schedulePath}
      className={cn(
        "relative bg-primary-muted rounded-full flex items-center justify-center shadow-xl rotate-12 hover:scale-105 transition-transform border-[3px] border-white/20",
        "w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36",
        className,
      )}
    >
      <div className="absolute inset-1 animate-[spin_10s_linear_infinite]">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path
            id="heroCirclePath"
            d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
            fill="none"
          />
          <text
            className="text-[11px] font-black tracking-[0.18em] uppercase"
            fill="#D66E1F"
          >
            <textPath href="#heroCirclePath" startOffset="0%">
              VIEW SCHEDULE • VIEW SCHEDULE •
            </textPath>
          </text>
        </svg>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Calendar className="w-10 h-10 text-primary" strokeWidth={2.5} />
      </div>
    </Link>
  );
}

function LiveMatchCard({
  match,
  className,
  compact = false,
}: {
  match: Match;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      to={getMatchPath(match)}
      className={cn(
        "flex flex-col items-center justify-center rounded-[1.5rem] border border-white/30 shadow-xl",
        compact
          ? "min-w-[160px] shrink-0 p-4 bg-primary-hover/90"
          : "w-40 md:w-52 aspect-[3/3.5] p-5 bg-primary-hover/85 backdrop-blur-md rotate-0 hover:rotate-0 transition-transform duration-500",
        className,
      )}
    >
      <div
        className={cn(
          "rounded-full flex items-center justify-center mb-2 shadow-inner border-[3px] border-white/40 bg-primary",
          compact ? "w-12 h-12" : "w-16 h-16 md:w-20 md:h-20 mb-3",
        )}
      >
        <span
          className={cn(
            "text-white font-black",
            compact ? "text-xs" : "text-lg",
          )}
        >
          LIVE
        </span>
      </div>
      <div className="text-center w-full min-w-0">
        <p
          className={cn(
            "font-bold text-white truncate max-w-full drop-shadow-sm",
            compact ? "text-xs" : "text-sm md:text-base max-w-[140px]",
          )}
        >
          {match.home_team?.name ?? "Home"}
        </p>
        <p
          className={cn(
            "font-black text-white my-0.5 drop-shadow-md",
            compact ? "text-lg" : "text-xl md:text-2xl",
          )}
        >
          {match.home_score} – {match.away_score}
        </p>
        <p
          className={cn(
            "font-bold text-white truncate max-w-full drop-shadow-sm",
            compact ? "text-xs" : "text-sm md:text-base max-w-[140px]",
          )}
        >
          {match.away_team?.name ?? "Away"}
        </p>
      </div>
    </Link>
  );
}

export function TournamentHubHeader() {
  const { data: liveMatches = [] } = useLiveMatches();
  const { data: tournaments = [] } = useTournaments();

  const featuredTournament = pickFeaturedTournament(tournaments);
  const schedulePath = tournamentOverviewPath(featuredTournament);

  const featuredLive = liveMatches.slice(0, 2);

  return (
    <section className="relative bg-primary overflow-x-hidden w-full">
      <div className="absolute inset-0 bg-brand-grid pointer-events-none z-0" />

      <div className="relative z-10 px-4 pt-6 pb-10 sm:pt-8 sm:pb-12 md:pt-10 md:pb-48 flex flex-col items-center w-full max-w-[1440px] mx-auto">
        <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center text-center md:min-h-[420px]">
          <div className="hero-headline-stack w-full flex flex-col items-center relative z-10 pointer-events-none">
            <div className="w-full flex justify-start pl-[8%] md:pl-[25%] relative z-30">
              <h1 className="hero-headline hero-headline-shadow text-[clamp(2.75rem,14vw,160px)] text-primary-muted m-0 p-0">
                BC
              </h1>
            </div>

            <div className="w-full flex justify-center relative z-20">
              <h1 className="hero-headline hero-headline-shadow text-[clamp(3rem,16vw,220px)] text-white m-0 p-0">
                TIGERS
              </h1>
            </div>

            <div className="w-full flex justify-start pl-[12%] md:pl-[30%] relative z-10">
              <h1 className="hero-headline hero-headline-shadow text-[clamp(2.75rem,14vw,160px)] text-white m-0 p-0">
                SOCCER
              </h1>
            </div>
          </div>

          {featuredTournament && (
            <div className="relative z-20 mt-8 md:mt-10 w-full max-w-xl mx-auto rounded-2xl bg-black/30 backdrop-blur-sm border border-white/25 px-4 py-4 sm:px-5 sm:py-4 text-sm text-white shadow-lg pointer-events-auto">
              <div className="flex flex-col items-center gap-3">
                <Link
                  to={schedulePath}
                  className="inline-flex items-center gap-1.5 font-bold text-white hover:text-primary-muted transition-colors text-center"
                >
                  <Trophy className="w-4 h-4 text-primary-muted shrink-0" />
                  {featuredTournament.name}
                </Link>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-white/95 text-xs sm:text-sm">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4 text-primary-muted shrink-0" />
                    {formatDate(featuredTournament.start_date)} –{" "}
                    {formatDate(featuredTournament.end_date)}
                  </span>
                  {featuredTournament.location && (
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <MapPin className="w-4 h-4 text-primary-muted shrink-0" />
                      {featuredTournament.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <Link
            to={schedulePath}
            className="md:hidden relative z-20 mt-6 mb-1 inline-flex items-center gap-2 rounded-full border-2 border-white bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white hover:text-primary transition-colors pointer-events-auto"
          >
            <Calendar className="w-4 h-4" />
            View Schedule
          </Link>

          <div className="hidden md:block absolute inset-0 w-full h-full pointer-events-none min-h-[420px]">
            {featuredLive[0] && (
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute bottom-[10%] left-[18%] z-30 pointer-events-auto"
              >
                <LiveMatchCard
                  match={featuredLive[0]}
                  className="rotate-[-12deg] hover:rotate-0"
                />
              </motion.div>
            )}

            {featuredLive[1] && (
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute top-[15%] right-[20%] z-30 pointer-events-auto"
              >
                <LiveMatchCard
                  match={featuredLive[1]}
                  className="rotate-[12deg] hover:rotate-0"
                />
              </motion.div>
            )}

            <div className="absolute bottom-[0%] left-[8%] w-32 h-32 z-20">
              <ArrowAccentLeft />
            </div>

            <div className="absolute top-[5%] right-[8%] w-32 h-32 z-20">
              <ArrowAccentRight />
            </div>

            <div className="absolute bottom-[-10%] right-[12%] z-40 pointer-events-auto">
              <CircularBadge schedulePath={schedulePath} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
