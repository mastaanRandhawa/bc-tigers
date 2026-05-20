import { Module } from '@nestjs/common';
import { MatchesGateway } from './matches.gateway';
import { StandingsModule } from '../modules/standings/standings.module';
import { BracketsModule } from '../modules/brackets/brackets.module';

@Module({
  imports: [StandingsModule, BracketsModule],
  providers: [MatchesGateway],
  exports: [MatchesGateway],
})
export class GatewaysModule {}
