import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

/** Admin, tournament admin, or referee (service must verify referee assignment per match). */
export function RefereeOrAdmin() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles('ADMIN', 'TOURNAMENT_ADMIN', 'REFEREE'),
  );
}
