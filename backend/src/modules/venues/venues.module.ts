import { Module } from '@nestjs/common';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
import { FieldsController } from './fields.controller';
import { FieldsService } from './fields.service';

@Module({
  controllers: [VenuesController, FieldsController],
  providers: [VenuesService, FieldsService],
  exports: [VenuesService, FieldsService],
})
export class VenuesModule {}
