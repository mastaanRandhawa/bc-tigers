import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

export function CoachOnly() {
  return applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles('COACH'));
}
