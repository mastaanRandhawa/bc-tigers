import { Module, forwardRef } from '@nestjs/common';
import { BracketsController } from './brackets.controller';
import { BracketsService } from './brackets.service';
import { BracketEngine } from './bracket-engine';
import { GatewaysModule } from '../../gateways/gateways.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [forwardRef(() => GatewaysModule), AuditLogModule],
  controllers: [BracketsController],
  providers: [BracketsService, BracketEngine],
  exports: [BracketsService, BracketEngine],
})
export class BracketsModule {}
