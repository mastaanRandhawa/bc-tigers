import { Module } from '@nestjs/common';
import { HubController } from './hub.controller';
import { HubService } from './hub.service';
import { MatchesModule } from '../matches/matches.module';

@Module({
  imports: [MatchesModule],
  controllers: [HubController],
  providers: [HubService],
})
export class HubModule {}
