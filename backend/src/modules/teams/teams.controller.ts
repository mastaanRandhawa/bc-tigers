import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { UserRole } from '@prisma/client';
import { TeamsService } from './teams.service';
import { AdminOnly } from '../auth/admin.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CoachTeamService } from '../auth/coach-team.service';

const COACH_TEAM_FIELDS = [
  'name',
  'city',
  'logo',
  'primary_color',
  'secondary_color',
] as const;

@Controller('teams')
export class TeamsController {
  constructor(
    private service: TeamsService,
    private coachTeamService: CoachTeamService,
  ) {}

  @Get()
  findAll(@Query('divisionId') divisionId?: string) {
    return this.service.findAll({ divisionId });
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.service.findOne(slug);
  }

  @Post()
  @AdminOnly()
  create(@Body() body: Record<string, unknown>) {
    return this.service.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() req: { user?: { userId: string; role: UserRole } },
  ) {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    if (!this.coachTeamService.isAdminRole(user.role)) {
      await this.coachTeamService.assertCoachOwnsTeam(user.userId, user.role, id);
      const filtered: Record<string, unknown> = {};
      for (const key of COACH_TEAM_FIELDS) {
        if (key in body) filtered[key] = body[key];
      }
      return this.service.update(id, filtered);
    }

    return this.service.update(id, body);
  }

  @Delete(':id')
  @AdminOnly()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
