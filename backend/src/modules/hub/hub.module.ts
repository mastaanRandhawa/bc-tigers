import { Module } from '@nestjs/common';
import { HubController } from './hub.controller';
import { HubService } from './hub.service';
import { MatchesModule } from '../matches/matches.module';
import { DivisionsModule } from '../divisions/divisions.module';

@Module({
  imports: [MatchesModule, DivisionsModule],
  controllers: [HubController],
  providers: [HubService],
})
export class HubModule {}
