import { Module } from '@nestjs/common';
import { CoachesController, TeamCoachesController } from './coaches.controller';
import { CoachesService } from './coaches.service';

@Module({
  controllers: [CoachesController, TeamCoachesController],
  providers: [CoachesService],
  exports: [CoachesService],
})
export class CoachesModule {}
