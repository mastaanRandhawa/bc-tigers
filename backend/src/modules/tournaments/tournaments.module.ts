import { Module } from '@nestjs/common';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { TournamentAdminsController } from './tournament-admins.controller';

@Module({
  controllers: [TournamentsController, TournamentAdminsController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
