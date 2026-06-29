import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamPlayersController } from './team-players.controller';
import { TeamOfficialsController } from './team-officials.controller';
import { TeamsService } from './teams.service';
import { TeamPlayersService } from './team-players.service';
import { TeamOfficialsService } from './team-officials.service';
import { CoachTeamRequestsService } from './coach-team-requests.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [
    TeamsController,
    TeamPlayersController,
    TeamOfficialsController,
  ],
  providers: [
    TeamsService,
    TeamPlayersService,
    TeamOfficialsService,
    CoachTeamRequestsService,
  ],
  exports: [
    TeamsService,
    TeamPlayersService,
    TeamOfficialsService,
    CoachTeamRequestsService,
  ],
})
export class TeamsModule {}
