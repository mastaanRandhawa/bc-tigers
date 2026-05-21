import { Link } from "react-router-dom";
import { Calendar, MapPin, Trophy } from "lucide-react";
import { formatDate } from "@/lib/date";
import { tournamentOverviewPath } from "@/lib/featured-tournament";
import type { Tournament } from "@/types";

interface TournamentHubHeaderProps {
  tournament?: Tournament | null;
}

export function TournamentHubHeader({ tournament }: TournamentHubHeaderProps) {
  const tournamentPath = tournamentOverviewPath(tournament ?? undefined);

  return (
    <section className="relative bg-primary overflow-x-hidden w-full">
      <div className="absolute inset-0 bg-brand-grid pointer-events-none z-0" />

      <div className="relative z-10 px-4 pt-10 pb-16 sm:pt-12 sm:pb-20 md:pt-14 md:pb-24 flex flex-col items-center w-full max-w-[1440px] mx-auto">
        <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="hero-headline-stack w-full flex flex-col items-center relative z-10">
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

          {tournament && (
            <div className="relative z-20 mt-8 md:mt-10 w-full max-w-xl mx-auto rounded-2xl bg-black/30 backdrop-blur-sm border border-white/25 px-5 py-5 text-sm text-white shadow-lg">
              <Link
                to={tournamentPath}
                className="inline-flex items-center justify-center gap-2 font-bold text-white hover:text-primary-muted transition-colors"
              >
                <Trophy className="w-4 h-4 text-primary-muted shrink-0" />
                {tournament.name}
              </Link>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-white/90 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary-muted shrink-0" />
                  {formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}
                </span>
                {tournament.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary-muted shrink-0" />
                    {tournament.location}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
