import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchField from '@/components/shared/SearchField';
import SearchEmpty from '@/components/shared/SearchEmpty';
import { useListSearch } from '@/hooks/useListSearch';
import { tournamentSearchText } from '@/lib/search-text';
import PrefetchLink from '@/components/shared/PrefetchLink';
import PageLayout from '@/components/PageLayout';
import Footer from '@/components/Footer';
import { TournamentHubHeader } from '@/components/ui/hero';
import MatchCard from '@/components/MatchCard';
import SectionHeader from '@/components/shared/SectionHeader';
import Section from '@/components/shared/Section';
import QueryState from '@/components/shared/QueryState';
import { Badge } from '@/components/ui/badge';
import { useHomeHub } from '@/hooks/useHomeHub';
import { formatDate } from '@/lib/date';
import { pickFeaturedTournament } from '@/lib/featured-tournament';
import { ChevronRight, Trophy, Megaphone, Plus, Pencil, Trash2 } from 'lucide-react';
import { RevealOnScroll } from '@/components/motion/RevealOnScroll';
import { useCanAdminEdit } from '@/hooks/useCanAdminEdit';
import { AdminActionButton } from '@/components/admin/inline/AdminActionButton';
import { AnnouncementDialog } from '@/components/admin/inline/AnnouncementDialog';
import { useDeleteAnnouncement } from '@/hooks/useAnnouncements';
import type { HubAnnouncement } from '@/services/hub.service';

export default function HomePage() {
  const { data, isLoading, isError, refetch } = useHomeHub();
  const canEdit = useCanAdminEdit();
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<HubAnnouncement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteMutation = useDeleteAnnouncement();

  const tournaments = data?.tournaments ?? [];
  const liveMatches = data?.liveMatches ?? [];
  const announcements = data?.announcements ?? [];

  const featuredTournament = useMemo(
    () => pickFeaturedTournament(tournaments),
    [tournaments],
  );

  const highlightedTournaments = useMemo(
    () => tournaments.filter((t) => t.status === 'UPCOMING' || t.status === 'ACTIVE'),
    [tournaments],
  );

  const getTournamentText = useCallback(
    (t: (typeof tournaments)[0]) => tournamentSearchText(t),
    [],
  );
  const {
    search: tournamentSearch,
    setSearch: setTournamentSearch,
    filtered: filteredTournaments,
    debouncedSearch: debouncedTournamentSearch,
    hasQuery: hasTournamentQuery,
  } = useListSearch(tournaments, getTournamentText);

  const displayTournaments = hasTournamentQuery
    ? filteredTournaments
    : filteredTournaments.slice(0, 4);

  return (
    <PageLayout heroTheme showFooter={false}>
      <TournamentHubHeader />

      <section className="w-full bg-surface-muted">
        <div className="page-container py-5 md:py-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
            <div>
              <h2 className="text-section m-0">Active Competitions</h2>
              <p className="text-body-sm mt-1 text-muted-foreground">
                {featuredTournament
                  ? `Featured: ${featuredTournament.name}`
                  : 'Browse active and upcoming tournaments'}
              </p>
            </div>
            <Link
              to="/tournaments"
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              All tournaments
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <QueryState
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            variant="skeleton-cards"
          >
            {highlightedTournaments.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <Trophy className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="text-sm font-medium text-foreground">Quick access</span>
                <div className="flex flex-wrap gap-1.5">
                  {highlightedTournaments.slice(0, 5).map((t) => (
                    <Link
                      key={t.id}
                      to={`/tournaments/${t.slug}`}
                      className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                    >
                      {t.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(announcements.length > 0 || canEdit) && (
              <Section className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <SectionHeader title="Announcements" />
                  </div>
                  {canEdit && (
                    <AdminActionButton
                      size="xs"
                      onClick={() => { setEditingAnnouncement(null); setAnnouncementOpen(true); }}
                    >
                      <Plus className="h-3 w-3" />
                      Publish
                    </AdminActionButton>
                  )}
                </div>
                {announcements.length > 0 ? (
                  <ul className="space-y-2">
                    {announcements.map((a) => (
                      <li
                        key={a.id}
                        className="rounded-lg border border-border bg-card px-4 py-3"
                      >
                        {deletingId === a.id ? (
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-muted-foreground">Delete this announcement?</p>
                            <div className="flex items-center gap-2 shrink-0">
                              <AdminActionButton
                                size="xs"
                                variant="destructive"
                                onClick={() => deleteMutation.mutate(a.id, { onSuccess: () => setDeletingId(null) })}
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                              </AdminActionButton>
                              <AdminActionButton size="xs" variant="ghost" onClick={() => setDeletingId(null)}>
                                Cancel
                              </AdminActionButton>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground">{a.title}</p>
                              <p className="mt-0.5 text-sm text-muted-foreground">{a.message}</p>
                            </div>
                            {canEdit && (
                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                <AdminActionButton
                                  size="xs"
                                  variant="ghost"
                                  onClick={() => { setEditingAnnouncement(a); setAnnouncementOpen(true); }}
                                  aria-label="Edit announcement"
                                >
                                  <Pencil className="h-3 w-3" />
                                </AdminActionButton>
                                <AdminActionButton
                                  size="xs"
                                  variant="destructive"
                                  onClick={() => setDeletingId(a.id)}
                                  aria-label="Delete announcement"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </AdminActionButton>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  canEdit && (
                    <p className="py-4 text-sm text-muted-foreground">
                      No announcements yet. Publish one to show it here.
                    </p>
                  )
                )}
              </Section>
            )}

            <section>
              <SectionHeader title="Featured tournaments" href="/tournaments" linkLabel="View all" />
              {tournaments.length > 4 && (
                <SearchField
                  value={tournamentSearch}
                  onChange={setTournamentSearch}
                  placeholder="Search tournaments…"
                  className="mb-4 max-w-md"
                />
              )}
              <QueryState
                isEmpty={tournaments.length === 0}
                emptyMessage="No tournaments yet."
                variant="skeleton-cards"
              >
                {hasTournamentQuery && displayTournaments.length === 0 ? (
                  <SearchEmpty query={debouncedTournamentSearch} entityLabel="tournaments" />
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {displayTournaments.map((t) => (
                      <PrefetchLink
                        key={t.id}
                        to={`/tournaments/${t.slug}`}
                        tournamentSlug={t.slug}
                        className="group ds-card-hover overflow-hidden"
                      >
                        <div className="relative flex h-20 items-center justify-center border-b border-border bg-surface-muted">
                          <div className="rounded-xl border border-border bg-card p-2 shadow-sm">
                            <Trophy className="h-6 w-6 text-primary" aria-hidden />
                          </div>
                          <Badge
                            variant={
                              t.status === 'ACTIVE'
                                ? 'success'
                                : t.status === 'UPCOMING'
                                  ? 'scheduled'
                                  : 'default'
                            }
                            className="absolute right-2.5 top-2.5 rounded-md"
                          >
                            {t.status}
                          </Badge>
                        </div>
                        <div className="p-3.5">
                          <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
                            {t.name}
                          </h3>
                          <p className="mt-0.5 text-sm text-muted-foreground">{t.location}</p>
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {formatDate(t.start_date)} – {formatDate(t.end_date)}
                          </p>
                        </div>
                      </PrefetchLink>
                    ))}
                  </div>
                )}
              </QueryState>
            </section>
          </QueryState>

          {liveMatches.length > 0 && (
            <RevealOnScroll>
              <Section className="mt-6">
                <SectionHeader title="Live now" linkLabel="View tournaments" href="/tournaments" />
                <div className="overflow-hidden rounded-md border border-border/60 bg-card">
                  {liveMatches.slice(0, 6).map((match, index) => (
                    <MatchCard key={match.id} match={match} flat divider={index > 0} />
                  ))}
                </div>
              </Section>
            </RevealOnScroll>
          )}
        </div>

        <Footer className="mt-10 md:mt-12" />
      </section>

      {canEdit && (
        <AnnouncementDialog
          open={announcementOpen}
          onOpenChange={(open) => { setAnnouncementOpen(open); if (!open) setEditingAnnouncement(null); }}
          announcement={editingAnnouncement}
        />
      )}
    </PageLayout>
  );
}
