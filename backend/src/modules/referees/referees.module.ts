import { Module } from '@nestjs/common';
import { RefereesController } from './referees.controller';
import { RefereesService } from './referees.service';

@Module({
  controllers: [RefereesController],
  providers: [RefereesService],
  exports: [RefereesService],
})
export class RefereesModule {}
