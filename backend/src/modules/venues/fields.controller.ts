import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { FieldsService } from './fields.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller()
export class FieldsController {
  constructor(private service: FieldsService) {}

  @Get('venues/:venueId/fields')
  getByVenue(@Param('venueId') venueId: string) {
    return this.service.getByVenue(venueId);
  }

  @Post('venues/:venueId/fields')
  @AdminOnly()
  create(
    @Param('venueId') venueId: string,
    @Body() body: { name: string; surface?: string; capacity?: number },
  ) {
    return this.service.create(venueId, body);
  }

  @Patch('fields/:id')
  @AdminOnly()
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; surface?: string; capacity?: number },
  ) {
    return this.service.update(id, body);
  }

  @Delete('fields/:id')
  @AdminOnly()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
