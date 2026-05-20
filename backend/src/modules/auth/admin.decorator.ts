import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

export function AdminOnly() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles('ADMIN', 'TOURNAMENT_ADMIN'),
  );
}

export function SuperAdminOnly() {
  return applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles('ADMIN'));
}
