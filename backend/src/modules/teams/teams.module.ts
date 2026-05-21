import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TeamsController } from './teams.controller';
import { TeamRostersController } from './team-rosters.controller';
import { TeamsService } from './teams.service';
import { TeamRostersService } from './team-rosters.service';

@Module({
  imports: [AuthModule],
  controllers: [TeamsController, TeamRostersController],
  providers: [TeamsService, TeamRostersService],
  exports: [TeamsService, TeamRostersService],
})
export class TeamsModule {}
