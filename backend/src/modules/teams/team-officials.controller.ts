import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { TeamOfficialsService } from './team-officials.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller('teams/:teamId/officials')
export class TeamOfficialsController {
  constructor(private service: TeamOfficialsService) {}

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

  @Patch(':officialId')
  @AdminOnly()
  update(
    @Param('teamId') teamId: string,
    @Param('officialId') officialId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.update(teamId, officialId, body);
  }

  @Delete(':officialId')
  @AdminOnly()
  remove(
    @Param('teamId') teamId: string,
    @Param('officialId') officialId: string,
  ) {
    return this.service.remove(teamId, officialId);
  }
}
