import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { assertCoachCanEditTeam } from './coach-permissions';

@Injectable()
export class CoachCanEditGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      user?: { userId: string; role: string };
      coachTeamId?: string;
    }>();

    if (req.user?.role !== 'COACH') return true;

    const teamId = req.coachTeamId;
    if (!teamId) return false;

    await assertCoachCanEditTeam(req.user.userId, teamId);
    return true;
  }
}
