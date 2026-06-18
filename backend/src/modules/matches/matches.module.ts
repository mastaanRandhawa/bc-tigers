import { Module, forwardRef } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchOfficialsController } from './match-officials.controller';
import { MatchesService } from './matches.service';
import { GatewaysModule } from '../../gateways/gateways.module';
import { SettingsModule } from '../settings/settings.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => GatewaysModule),
    SettingsModule,
    NotificationsModule,
  ],
  controllers: [MatchesController, MatchOfficialsController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
