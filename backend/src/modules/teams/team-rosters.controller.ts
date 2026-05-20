import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { TeamRostersService } from './team-rosters.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller('teams/:teamId/rosters')
export class TeamRostersController {
  constructor(private service: TeamRostersService) {}

  @Get()
  findAll(@Param('teamId') teamId: string) {
    return this.service.findByTeam(teamId);
  }

  @Post()
  @AdminOnly()
  add(
    @Param('teamId') teamId: string,
    @Body() body: { player_id: string; season?: string; active?: boolean },
  ) {
    return this.service.addPlayer(teamId, body);
  }

  @Patch(':rosterId')
  @AdminOnly()
  update(
    @Param('teamId') teamId: string,
    @Param('rosterId') rosterId: string,
    @Body() body: { active?: boolean; season?: string },
  ) {
    return this.service.update(teamId, rosterId, body);
  }

  @Delete(':rosterId')
  @AdminOnly()
  remove(@Param('teamId') teamId: string, @Param('rosterId') rosterId: string) {
    return this.service.remove(teamId, rosterId);
  }
}
