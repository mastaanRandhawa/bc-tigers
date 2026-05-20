import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamRostersController } from './team-rosters.controller';
import { TeamsService } from './teams.service';
import { TeamRostersService } from './team-rosters.service';

@Module({
  controllers: [TeamsController, TeamRostersController],
  providers: [TeamsService, TeamRostersService],
  exports: [TeamsService, TeamRostersService],
})
export class TeamsModule {}
