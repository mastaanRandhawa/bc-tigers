import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, MapPin, Trophy } from "lucide-react";
import { m } from "motion/react";
import { useTournaments } from "@/hooks/useTournaments";
import { formatDate } from "@/lib/date";
import {
  pickFeaturedTournament,
  tournamentOverviewPath,
} from "@/lib/featured-tournament";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { fadeUp, transitionFade } from "@/lib/motion/variants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import logoUrl from "@/assets/logo.png";

function MotionBlock({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      transition={{ ...transitionFade, delay }}
    >
      {children}
    </m.div>
  );
}

export function TournamentHubHeader() {
  const { data: tournaments = [] } = useTournaments();
  const featuredTournament = pickFeaturedTournament(tournaments);
  const schedulePath = tournamentOverviewPath(featuredTournament);

  const headline = featuredTournament
    ? featuredTournament.name
    : "BC Tigers FC tournament hub";

  return (
    <section
      aria-labelledby="hub-hero-heading"
      className="hub-hero relative flex min-h-[min(88dvh,920px)] flex-col bg-primary pt-[5.5rem] text-white md:pt-[7rem]"
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-tiger-stripes" />
      <div className="hub-hero-glow" aria-hidden />

      <div className="relative z-10 flex flex-1 flex-col justify-center py-12 md:py-16 lg:py-20">
        <div className="page-container">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] md:gap-8 lg:gap-12">
            <MotionBlock className="flex justify-center md:justify-start" delay={0.05}>
              <img
                src={logoUrl}
                alt=""
                className="hub-hero-logo w-52 object-contain sm:w-60 md:w-[19rem] lg:w-[25rem] xl:w-[28rem]"
              />
            </MotionBlock>

            <div className="flex flex-col gap-6 text-center md:gap-7 md:text-left">
              <MotionBlock delay={0.12}>
                <p className="hub-hero-eyebrow mb-3">Live tournament hub</p>
                <h1
                  id="hub-hero-heading"
                  className="font-display text-[clamp(1.75rem,4.5vw,3.25rem)] font-bold leading-[1.05] tracking-tight text-balance"
                >
                  {headline}
                </h1>
              </MotionBlock>

              <MotionBlock delay={0.2}>
                <p className="max-w-xl text-base font-medium leading-relaxed text-white/90 sm:text-lg md:text-xl">
                  Fixtures, standings, and knockout brackets for BC Tigers FC
                  competitions — updated as matches are played.
                </p>
              </MotionBlock>

              {featuredTournament && (
                <MotionBlock delay={0.28}>
                  <div className="hub-hero-panel rounded-xl p-4 sm:p-5">
                    <div className="flex flex-col gap-3 text-left text-sm sm:text-base">
                      <span className="inline-flex items-center gap-2 font-semibold text-white">
                        <Trophy className="h-4 w-4 shrink-0 text-white/85" aria-hidden />
                        Featured tournament
                      </span>
                      <span className="inline-flex items-center gap-2 text-white/90">
                        <Calendar className="h-4 w-4 shrink-0 text-white/75" aria-hidden />
                        {formatDate(featuredTournament.start_date)} –{" "}
                        {formatDate(featuredTournament.end_date)}
                      </span>
                      {featuredTournament.location && (
                        <span className="inline-flex items-center gap-2 text-white/90">
                          <MapPin className="h-4 w-4 shrink-0 text-white/75" aria-hidden />
                          {featuredTournament.location}
                        </span>
                      )}
                    </div>
                  </div>
                </MotionBlock>
              )}

              <MotionBlock delay={0.36}>
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap md:items-start">
                  <Button
                    asChild
                    size="lg"
                    className={cn(
                      "h-12 rounded-lg bg-white px-6 text-base font-bold text-primary shadow-[0_10px_28px_rgba(72,28,0,0.28)]",
                      "hover:bg-white/95 hover:shadow-[0_14px_32px_rgba(72,28,0,0.32)]",
                      "focus-visible:ring-white focus-visible:ring-offset-primary",
                    )}
                  >
                    <Link to={schedulePath}>
                      View schedule
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                  <Link
                    to="/tournaments"
                    className="inline-flex items-center gap-1.5 px-1 py-2 text-sm font-semibold text-white/90 underline-offset-4 transition-colors hover:text-white hover:underline"
                  >
                    Browse all tournaments
                  </Link>
                </div>
              </MotionBlock>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
