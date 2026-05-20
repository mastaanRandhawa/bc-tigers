import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { CoachesService } from './coaches.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller('coaches')
export class CoachesController {
  constructor(private service: CoachesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @AdminOnly()
  create(@Body() body: Record<string, unknown>) {
    return this.service.create(body);
  }

  @Patch(':id')
  @AdminOnly()
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @AdminOnly()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

@Controller('teams/:teamId/coaches')
export class TeamCoachesController {
  constructor(private service: CoachesService) {}

  @Post()
  @AdminOnly()
  assign(
    @Param('teamId') teamId: string,
    @Body() body: { coach_id: string; role?: string },
  ) {
    return this.service.assignToTeam(teamId, body.coach_id, body.role);
  }

  @Delete(':teamCoachId')
  @AdminOnly()
  remove(
    @Param('teamId') teamId: string,
    @Param('teamCoachId') teamCoachId: string,
  ) {
    return this.service.removeFromTeam(teamId, teamCoachId);
  }
}
