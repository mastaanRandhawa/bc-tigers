import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { getCoachTeamId } from './coach-permissions';

@Injectable()
export class CoachTeamGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      user?: { userId: string; role: string };
      coachTeamId?: string;
    }>();

    if (req.user?.role !== 'COACH') return true;

    const teamId = await getCoachTeamId(req.user.userId);
    if (!teamId) {
      throw new ForbiddenException('No team assigned to your coach account');
    }

    req.coachTeamId = teamId;
    return true;
  }
}
