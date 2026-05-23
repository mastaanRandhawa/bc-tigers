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

/** SVG filter that creates the liquid-glass distortion effect */
function GlassFilter() {
  return (
    <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden>
      <defs>
        <filter
          id="hero-glass"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.045 0.045"
            numOctaves="1"
            seed="3"
            result="turbulence"
          />
          <feGaussianBlur in="turbulence" stdDeviation="1.5" result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="55"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="3.5" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

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
        "flex flex-col items-center justify-center rounded-2xl relative overflow-hidden",
        "border border-white/30",
        compact
          ? "min-w-[140px] shrink-0 p-3"
          : "w-[5.5rem] sm:w-32 md:w-38 lg:w-44 aspect-[3/3.5] p-2 sm:p-3.5 md:p-5",
        className,
      )}
      style={{
        boxShadow:
          "0 6px 24px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12), inset 2px 2px 1px -2px rgba(255,255,255,0.55), inset -2px -2px 1px -2px rgba(255,255,255,0.2), inset 0 0 8px 3px rgba(255,255,255,0.06)",
      }}
    >
      {/* Liquid-glass backdrop distortion layer */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{ backdropFilter: 'url("#hero-glass") blur(10px)' }}
      />
      {/* Warm tint overlay */}
      <div className="absolute inset-0 bg-[#B85E0F]/35 rounded-2xl" />
      {/* Top highlight edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      {/* Bottom shadow edge */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full gap-0.5 sm:gap-1">
        {/* LIVE pill */}
        <div
          className={cn(
            "rounded-full flex items-center justify-center border border-white/50 bg-white/15 backdrop-blur-sm mb-1",
            compact ? "w-10 h-10" : "w-8 h-8 sm:w-11 sm:h-11 md:w-13 md:h-13",
          )}
          style={{
            boxShadow: "inset 0 1px 2px rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.18)",
          }}
        >
          <span
            className={cn(
              "text-white font-black drop-shadow-sm leading-none",
              compact ? "text-[10px]" : "text-[8px] sm:text-[10px] md:text-xs",
            )}
          >
            LIVE
          </span>
        </div>

        <div className="text-center w-full min-w-0">
          <p
            className={cn(
              "font-semibold text-white leading-tight drop-shadow-md",
              compact
                ? "text-xs truncate max-w-[120px]"
                : "text-[9px] sm:text-[11px] md:text-sm truncate max-w-[4.5rem] sm:max-w-[110px] md:max-w-[130px]",
            )}
          >
            {match.home_team?.name ?? "Home"}
          </p>
          <p
            className={cn(
              "font-black text-white drop-shadow-lg leading-tight my-0.5",
              compact ? "text-base" : "text-sm sm:text-lg md:text-xl lg:text-2xl",
            )}
          >
            {match.home_score} – {match.away_score}
          </p>
          <p
            className={cn(
              "font-semibold text-white leading-tight drop-shadow-md",
              compact
                ? "text-xs truncate max-w-[120px]"
                : "text-[9px] sm:text-[11px] md:text-sm truncate max-w-[4.5rem] sm:max-w-[110px] md:max-w-[130px]",
            )}
          >
            {match.away_team?.name ?? "Away"}
          </p>
        </div>
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
      <GlassFilter />
      <div className="absolute inset-0 bg-brand-grid pointer-events-none z-0" />

      <div className="relative z-10 px-4 pt-[calc(3.5rem+1.25rem)] pb-28 sm:pt-[calc(3.5rem+1.5rem)] sm:pb-32 md:pt-[calc(3.5rem+2rem)] md:pb-48 flex flex-col items-center w-full max-w-[1440px] mx-auto max-md:pt-[calc(6.75rem+1rem)]">
        <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center text-center min-h-[300px] sm:min-h-[360px] md:min-h-[420px]">
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

          <div className="absolute inset-0 w-full h-full pointer-events-none min-h-[300px] sm:min-h-[360px] md:min-h-[420px]">
            {/* Left card — pushed to the far left edge */}
            {featuredLive[0] && (
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[8%] left-[-3%] sm:bottom-[6%] sm:left-[-1%] md:bottom-[8%] md:left-[0%] z-30 pointer-events-auto"
              >
                <LiveMatchCard
                  match={featuredLive[0]}
                  className="rotate-[-8deg] sm:rotate-[-16deg] md:rotate-[-20deg] hover:rotate-[-2deg] transition-transform duration-500"
                />
              </motion.div>
            )}

            {/* Right card — pushed to the far right edge */}
            {featuredLive[1] && (
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-[6%] right-[-3%] sm:top-[10%] sm:right-[-1%] md:top-[12%] md:right-[0%] z-30 pointer-events-auto"
              >
                <LiveMatchCard
                  match={featuredLive[1]}
                  className="rotate-[8deg] sm:rotate-[16deg] md:rotate-[20deg] hover:rotate-[2deg] transition-transform duration-500"
                />
              </motion.div>
            )}

            <div className="absolute bottom-[30%] left-[6%] w-14 h-14 hidden sm:block sm:bottom-[35%] sm:left-[8%] sm:w-20 sm:h-20 md:w-28 md:h-28 z-20 opacity-80">
              <ArrowAccentLeft />
            </div>

            <div className="absolute top-[2%] right-[6%] w-14 h-14 hidden sm:block sm:top-[3%] sm:right-[8%] sm:w-20 sm:h-20 md:w-28 md:h-28 z-20 opacity-80">
              <ArrowAccentRight />
            </div>

            <div className="absolute bottom-[-6%] right-[4%] sm:bottom-[-8%] sm:right-[8%] md:bottom-[-10%] md:right-[12%] z-40 pointer-events-auto scale-90 sm:scale-100">
              <CircularBadge schedulePath={schedulePath} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
