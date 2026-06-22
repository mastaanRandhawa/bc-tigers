import { Module } from '@nestjs/common';
import { DivisionsController } from './divisions.controller';
import { DivisionResourcesController } from './division-resources.controller';
import { DivisionsService } from './divisions.service';
import { DivisionResourcesService } from './division-resources.service';
import { TeamsModule } from '../teams/teams.module';
import { MatchesModule } from '../matches/matches.module';
import { StandingsModule } from '../standings/standings.module';
import { BracketsModule } from '../brackets/brackets.module';
import { VenuesModule } from '../venues/venues.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TeamsModule,
    MatchesModule,
    StandingsModule,
    BracketsModule,
    VenuesModule,
    AuditLogModule,
  ],
  controllers: [DivisionsController, DivisionResourcesController],
  providers: [DivisionsService, DivisionResourcesService],
  exports: [DivisionsService, DivisionResourcesService],
})
export class DivisionsModule {}
