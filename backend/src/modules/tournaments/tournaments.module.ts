import { Module, forwardRef } from '@nestjs/common';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { BracketsModule } from '../brackets/brackets.module';

@Module({
  imports: [AuditLogModule, forwardRef(() => BracketsModule)],
  controllers: [TournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
