import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [AuditLogModule, TeamsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
