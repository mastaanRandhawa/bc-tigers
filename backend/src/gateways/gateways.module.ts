import { Module, forwardRef } from '@nestjs/common';
import { MatchesGateway } from './matches.gateway';
import { StandingsModule } from '../modules/standings/standings.module';
import { BracketsModule } from '../modules/brackets/brackets.module';
import { MatchesModule } from '../modules/matches/matches.module';

@Module({
  imports: [
    StandingsModule,
    forwardRef(() => BracketsModule),
    forwardRef(() => MatchesModule),
  ],
  providers: [MatchesGateway],
  exports: [MatchesGateway],
})
export class GatewaysModule {}
