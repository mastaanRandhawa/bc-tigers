import { Module, forwardRef } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchRefereesController } from './match-referees.controller';
import { MatchesService } from './matches.service';
import { GatewaysModule } from '../../gateways/gateways.module';
import { MeModule } from '../me/me.module';
import { SettingsModule } from '../settings/settings.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => GatewaysModule),
    MeModule,
    SettingsModule,
    NotificationsModule,
  ],
  controllers: [MatchesController, MatchRefereesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
