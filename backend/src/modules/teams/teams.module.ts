import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamPlayersController } from './team-players.controller';
import { TeamsService } from './teams.service';
import { TeamPlayersService } from './team-players.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [TeamsController, TeamPlayersController],
  providers: [TeamsService, TeamPlayersService],
  exports: [TeamsService, TeamPlayersService],
})
export class TeamsModule {}
