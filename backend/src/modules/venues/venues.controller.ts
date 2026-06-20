import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { VenuesService } from './venues.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller('venues')
export class VenuesController {
  constructor(private service: VenuesService) {}

  @Get() findAll() {
    return this.service.findAll();
  }

  @Post()
  @AdminOnly()
  create(@Body() body: Record<string, unknown>) {
    return this.service.create(body);
  }

  @Patch(':id')
  @AdminOnly()
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @AdminOnly()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
