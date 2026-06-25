import {
  canViewTeamRoster,
  isAdminRole,
  stripTeamPlayers,
} from './roster-visibility';

describe('roster-visibility', () => {
  describe('isAdminRole', () => {
    it('recognizes admin roles', () => {
      expect(isAdminRole('ADMIN')).toBe(true);
      expect(isAdminRole('SUPERADMIN')).toBe(true);
      expect(isAdminRole('COACH')).toBe(false);
    });
  });

  describe('canViewTeamRoster', () => {
    it('allows everyone when rosters are public', () => {
      expect(canViewTeamRoster(undefined, null, true)).toBe(true);
    });

    it('denies anonymous viewers when rosters are not public', () => {
      expect(canViewTeamRoster(undefined, 'coach-1', false)).toBe(false);
    });

    it('allows admins before publish', () => {
      expect(
        canViewTeamRoster({ userId: 'admin-1', role: 'ADMIN' }, null, false),
      ).toBe(true);
    });

    it('allows assigned coach before publish', () => {
      expect(
        canViewTeamRoster({ userId: 'coach-1', role: 'COACH' }, 'coach-1', false),
      ).toBe(true);
    });

    it('denies other coaches before publish', () => {
      expect(
        canViewTeamRoster({ userId: 'coach-2', role: 'COACH' }, 'coach-1', false),
      ).toBe(false);
    });
  });

  describe('stripTeamPlayers', () => {
    it('removes players when viewer cannot see roster', () => {
      const team = { id: 't1', name: 'Tigers', players: [{ id: 'p1' }] };
      expect(stripTeamPlayers(team, false)).toEqual({
        id: 't1',
        name: 'Tigers',
        players: [],
      });
    });

    it('keeps players when viewer can see roster', () => {
      const team = { id: 't1', name: 'Tigers', players: [{ id: 'p1' }] };
      expect(stripTeamPlayers(team, true)).toBe(team);
    });
  });
});
