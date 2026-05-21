export const MANAGEMENT_BASE = '/management';

export const managementRoutes = {
  dashboard: `${MANAGEMENT_BASE}/dashboard`,
  tournaments: `${MANAGEMENT_BASE}/tournaments`,
  divisions: `${MANAGEMENT_BASE}/divisions`,
  schedules: `${MANAGEMENT_BASE}/schedules`,
  matches: `${MANAGEMENT_BASE}/matches`,
  venues: `${MANAGEMENT_BASE}/venues`,
  referees: `${MANAGEMENT_BASE}/referees`,
  media: `${MANAGEMENT_BASE}/media`,
  analytics: `${MANAGEMENT_BASE}/analytics`,
  settings: `${MANAGEMENT_BASE}/settings`,
  teams: `${MANAGEMENT_BASE}/teams`,
  players: `${MANAGEMENT_BASE}/players`,
  standings: `${MANAGEMENT_BASE}/standings`,
  brackets: `${MANAGEMENT_BASE}/brackets`,
  users: `${MANAGEMENT_BASE}/users`,
} as const;

export function adminToManagementPath(adminPath: string): string {
  if (adminPath.startsWith('/admin')) {
    return adminPath.replace('/admin', MANAGEMENT_BASE);
  }
  return adminPath;
}
