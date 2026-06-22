import { Module } from '@nestjs/common';
import { TeamsModule } from '../teams/teams.module';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';
import { CoachTeamGuard } from '../auth/coach-team.guard';
import { CoachCanEditGuard } from '../auth/coach-can-edit.guard';

@Module({
  imports: [TeamsModule],
  controllers: [CoachController],
  providers: [CoachService, CoachTeamGuard, CoachCanEditGuard],
})
export class CoachModule {}
