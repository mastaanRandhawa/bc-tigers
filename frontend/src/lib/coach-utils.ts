import type { Team, User } from '@/types';
import { divisionTeamPath } from '@/lib/division-routes';

export function canManageTeam(user: User | null | undefined, teamId: string): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN' || user.role === 'TOURNAMENT_ADMIN') return true;
  if (user.role !== 'COACH' || !user.coach?.team_coaches) return false;
  return user.coach.team_coaches.some((tc) => tc.team?.id === teamId);
}

export function getCoachTeamPath(team: Team): string | null {
  const division = team.division;
  const tournamentSlug = division?.tournament?.slug;
  if (!tournamentSlug || !division?.slug) return null;
  return divisionTeamPath(tournamentSlug, division.slug, team.slug);
}

export function getPostLoginPath(user: Pick<User, 'role' | 'coach'> | null): string {
  if (!user) return '/';
  if (user.role === 'ADMIN' || user.role === 'TOURNAMENT_ADMIN') {
    return '/management/dashboard';
  }
  if (user.role === 'REFEREE') return '/referee';
  if (user.role === 'PLAYER') return '/player';
  if (user.role === 'COACH') {
    const firstTeam = user.coach?.team_coaches?.find((tc) => tc.team)?.team;
    if (firstTeam) {
      const path = getCoachTeamPath(firstTeam);
      if (path) return path;
    }
    return '/tournaments';
  }
  return '/tournaments';
}

export function getCoachTeams(user: User | null | undefined): Team[] {
  if (!user?.coach?.team_coaches) return [];
  return user.coach.team_coaches
    .map((tc) => tc.team)
    .filter((team): team is Team => !!team);
}
