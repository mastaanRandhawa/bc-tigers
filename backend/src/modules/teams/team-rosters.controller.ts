import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { UserRole } from '@prisma/client';
import { TeamRostersService } from './team-rosters.service';
import { AdminOnly } from '../auth/admin.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CoachTeamService } from '../auth/coach-team.service';

@Controller('teams/:teamId/rosters')
export class TeamRostersController {
  constructor(
    private service: TeamRostersService,
    private coachTeamService: CoachTeamService,
  ) {}

  @Get()
  findAll(@Param('teamId') teamId: string) {
    return this.service.findByTeam(teamId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async add(
    @Param('teamId') teamId: string,
    @Body() body: { player_id: string; season?: string; active?: boolean },
    @Req() req: { user?: { userId: string; role: UserRole } },
  ) {
    const user = req.user;
    if (!user) throw new UnauthorizedException();
    if (!this.coachTeamService.isAdminRole(user.role)) {
      await this.coachTeamService.assertCoachOwnsTeam(user.userId, user.role, teamId);
    }
    return this.service.addPlayer(teamId, body);
  }

  @Patch(':rosterId')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('teamId') teamId: string,
    @Param('rosterId') rosterId: string,
    @Body() body: { active?: boolean; season?: string },
    @Req() req: { user?: { userId: string; role: UserRole } },
  ) {
    const user = req.user;
    if (!user) throw new UnauthorizedException();
    if (!this.coachTeamService.isAdminRole(user.role)) {
      await this.coachTeamService.assertCoachOwnsTeam(user.userId, user.role, teamId);
    }
    return this.service.update(teamId, rosterId, body);
  }

  @Delete(':rosterId')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('teamId') teamId: string,
    @Param('rosterId') rosterId: string,
    @Req() req: { user?: { userId: string; role: UserRole } },
  ) {
    const user = req.user;
    if (!user) throw new UnauthorizedException();
    if (!this.coachTeamService.isAdminRole(user.role)) {
      await this.coachTeamService.assertCoachOwnsTeam(user.userId, user.role, teamId);
    }
    return this.service.remove(teamId, rosterId);
  }
}
