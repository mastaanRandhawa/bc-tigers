import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CoachOnly } from '../auth/coach.decorator';
import { CoachTeamGuard } from '../auth/coach-team.guard';
import { CoachCanEditGuard } from '../auth/coach-can-edit.guard';
import { CoachService } from './coach.service';

@Controller('coach')
@CoachOnly()
export class CoachController {
  constructor(private readonly service: CoachService) {}

  @Get('me')
  getMe(@Request() req: { user: { userId: string } }) {
    return this.service.getMe(req.user.userId);
  }

  @Get('team')
  getTeam(@Request() req: { user: { userId: string } }) {
    return this.service.getTeamForCoach(req.user.userId);
  }

  @Patch('team')
  @UseGuards(CoachTeamGuard, CoachCanEditGuard)
  updateTeam(
    @Request() req: { coachTeamId: string },
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.updateTeam(req.coachTeamId, body);
  }

  @Get('team/players')
  @UseGuards(CoachTeamGuard)
  listPlayers(@Request() req: { coachTeamId: string }) {
    return this.service.findPlayers(req.coachTeamId);
  }

  @Post('team/players')
  @UseGuards(CoachTeamGuard, CoachCanEditGuard)
  createPlayer(
    @Request() req: { coachTeamId: string },
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.createPlayer(req.coachTeamId, body);
  }

  @Patch('team/players/:playerId')
  @UseGuards(CoachTeamGuard, CoachCanEditGuard)
  updatePlayer(
    @Request() req: { coachTeamId: string },
    @Param('playerId') playerId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.updatePlayer(req.coachTeamId, playerId, body);
  }

  @Delete('team/players/:playerId')
  @UseGuards(CoachTeamGuard, CoachCanEditGuard)
  removePlayer(
    @Request() req: { coachTeamId: string },
    @Param('playerId') playerId: string,
  ) {
    return this.service.removePlayer(req.coachTeamId, playerId);
  }
}
