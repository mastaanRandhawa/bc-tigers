import { Module, forwardRef } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchRefereesController } from './match-referees.controller';
import { MatchesService } from './matches.service';
import { GatewaysModule } from '../../gateways/gateways.module';

@Module({
  imports: [forwardRef(() => GatewaysModule)],
  controllers: [MatchesController, MatchRefereesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
