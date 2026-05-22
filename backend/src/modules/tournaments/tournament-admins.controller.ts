import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller('tournaments')
export class TournamentAdminsController {
  constructor(private service: TournamentsService) {}

  @Get(':id/admins')
  @AdminOnly()
  getAdmins(@Param('id') id: string) {
    return this.service.getAdmins(id);
  }

  @Post(':id/admins')
  @AdminOnly()
  assignAdmin(
    @Param('id') id: string,
    @Body() body: { user_id: string; role?: string },
  ) {
    return this.service.assignAdmin(id, body.user_id, body.role);
  }

  @Delete(':id/admins/:tournamentAdminId')
  @AdminOnly()
  revokeAdmin(
    @Param('id') id: string,
    @Param('tournamentAdminId') tournamentAdminId: string,
  ) {
    return this.service.revokeAdmin(id, tournamentAdminId);
  }
}
