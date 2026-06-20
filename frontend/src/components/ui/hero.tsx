import { Link } from "react-router-dom";
import { Calendar, MapPin, Trophy } from "lucide-react";
import { useTournaments } from "@/hooks/useTournaments";
import { formatDate } from "@/lib/date";
import {
  pickFeaturedTournament,
  tournamentOverviewPath,
} from "@/lib/featured-tournament";
import { cn } from "@/lib/utils";
import { MinimalistHero } from "@/components/ui/minimalist-hero";
import logoUrl from "@/assets/logo.png";

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
        <Calendar className="w-12 h-12 text-primary" strokeWidth={2.5} />
      </div>
    </Link>
  );
}

export function TournamentHubHeader() {
  const { data: tournaments = [] } = useTournaments();

  const featuredTournament = pickFeaturedTournament(tournaments);
  const schedulePath = tournamentOverviewPath(featuredTournament);

  return (
    <MinimalistHero
      // Keep the brand color scheme: orange field, white ink.
      className="bg-primary pt-[5.5rem] text-white md:pt-[7rem]"
      imageSrc={logoUrl}
      imageAlt="BC Tigers FC"
      // Crest sits directly on the orange field — no disc, no drop shadow.
      imageClassName="w-48 object-contain sm:w-56 md:w-64 lg:w-80 xl:w-[26rem]"
      circleClassName="hidden"
      gridClassName="md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.35fr)]"
      overlayText={{
        part1: (
          <>
            BC
            <br />
            TIGERS
          </>
        ),
        part2: "FC",
      }}
      overlayClassName="font-display text-center leading-[0.82] tracking-tighter text-6xl sm:text-7xl md:text-left md:text-[6.5rem] lg:text-8xl xl:text-[9rem]"
      mainTextClassName="w-full text-base md:max-w-sm md:text-lg"
      mainText={
        <div className="space-y-5">
          <p className="font-medium">
            Live scores, schedules, standings, and knockout brackets — the home
            of BC&nbsp;Tigers&nbsp;FC tournament football.
          </p>
          {featuredTournament && (
            <div className="space-y-1.5 text-sm">
              <Link
                to={schedulePath}
                className="inline-flex items-center gap-1.5 font-bold no-underline transition-opacity hover:opacity-80"
              >
                <Trophy className="h-4 w-4 shrink-0 text-primary-muted" />
                {featuredTournament.name}
              </Link>
              <div className="flex flex-col gap-1">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 shrink-0 text-primary-muted" />
                  {formatDate(featuredTournament.start_date)} –{" "}
                  {formatDate(featuredTournament.end_date)}
                </span>
                {featuredTournament.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0 text-primary-muted" />
                    {featuredTournament.location}
                  </span>
                )}
              </div>
            </div>
          )}

          <Link
            to={schedulePath}
            className="inline-block font-semibold text-white underline decoration-from-font underline-offset-4 transition-opacity hover:opacity-80"
          >
            View schedule
          </Link>

          {/* Spinning schedule badge sits below the body text on the left. */}
          <div className="flex justify-center pt-2 md:justify-start">
            <CircularBadge
              schedulePath={schedulePath}
              className="h-32 w-32 sm:h-36 sm:w-36 md:h-44 md:w-44"
            />
          </div>
        </div>
      }
      locationText={featuredTournament?.location ?? "British Columbia, Canada"}
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-brand-grid" />
    </MinimalistHero>
  );
}
