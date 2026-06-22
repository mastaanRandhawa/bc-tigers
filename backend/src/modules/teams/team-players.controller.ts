import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { TeamPlayersService } from './team-players.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller('teams/:teamId/players')
export class TeamPlayersController {
  constructor(private service: TeamPlayersService) {}

  @Get()
  findAll(@Param('teamId') teamId: string) {
    return this.service.findByTeam(teamId);
  }

  @Post()
  @AdminOnly()
  create(
    @Param('teamId') teamId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.create(teamId, body);
  }

  @Patch(':playerId')
  @AdminOnly()
  update(
    @Param('teamId') teamId: string,
    @Param('playerId') playerId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.update(teamId, playerId, body);
  }

  @Delete(':playerId')
  @AdminOnly()
  remove(@Param('teamId') teamId: string, @Param('playerId') playerId: string) {
    return this.service.remove(teamId, playerId);
  }
}
