import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { getCoachTeamId, getCoachTeamIds } from './coach-permissions';

@Injectable()
export class CoachTeamGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      user?: { userId: string; role: string };
      query?: { team_id?: string };
      coachTeamId?: string;
    }>();

    if (req.user?.role !== 'COACH') return true;

    const teamIdParam = req.query?.team_id;
    const teamIds = await getCoachTeamIds(req.user.userId);

    if (teamIds.length === 0) {
      throw new ForbiddenException('No team assigned to your coach account');
    }

    if (teamIdParam) {
      const teamId = await getCoachTeamId(req.user.userId, teamIdParam);
      if (!teamId) {
        throw new ForbiddenException('You are not assigned to this team');
      }
      req.coachTeamId = teamId;
      return true;
    }

    if (teamIds.length > 1) {
      throw new ForbiddenException(
        'Multiple teams assigned — pass team_id to select a team',
      );
    }

    req.coachTeamId = teamIds[0];
    return true;
  }
}
