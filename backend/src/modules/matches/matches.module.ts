import { Module, forwardRef } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchOfficialsController } from './match-officials.controller';
import { MatchesService } from './matches.service';
import { GatewaysModule } from '../../gateways/gateways.module';
import { BracketsModule } from '../brackets/brackets.module';
import { MailModule } from '../mail/mail.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    forwardRef(() => GatewaysModule),
    forwardRef(() => BracketsModule),
    MailModule,
    AuditLogModule,
  ],
  controllers: [MatchesController, MatchOfficialsController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
