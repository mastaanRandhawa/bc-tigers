import { Module } from '@nestjs/common';
import { TournamentsController } from './tournaments.controller';
import { TournamentResourcesController } from './tournament-resources.controller';
import { TournamentsService } from './tournaments.service';
import { TournamentResourcesService } from './tournament-resources.service';
import { MatchesModule } from '../matches/matches.module';
import { StatsModule } from '../stats/stats.module';
import { VenuesModule } from '../venues/venues.module';

@Module({
  imports: [MatchesModule, StatsModule, VenuesModule],
  controllers: [TournamentsController, TournamentResourcesController],
  providers: [TournamentsService, TournamentResourcesService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
