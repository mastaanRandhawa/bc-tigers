import { Module } from '@nestjs/common';
import { PointFormatsController } from './point-formats.controller';
import { PointFormatsService } from './point-formats.service';

@Module({
  controllers: [PointFormatsController],
  providers: [PointFormatsService],
  exports: [PointFormatsService],
})
export class PointFormatsModule {}
