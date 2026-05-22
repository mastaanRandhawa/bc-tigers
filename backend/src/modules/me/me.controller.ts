import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MeService } from './me.service';
import type { UserRole } from '@prisma/client';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private service: MeService) {}

  @Get('matches')
  findMyMatches(
    @Request() req: { user: { userId: string; role: UserRole } },
    @Query() q: { status?: string; limit?: string },
  ) {
    return this.service.findMyMatches(req.user.userId, req.user.role, {
      status: q.status,
      limit: q.limit ? Number(q.limit) : undefined,
    });
  }

  @Get('matches/:id')
  findMyMatch(
    @Request() req: { user: { userId: string; role: UserRole } },
    @Param('id') id: string,
  ) {
    return this.service.findMyMatch(req.user.userId, req.user.role, id);
  }
}
