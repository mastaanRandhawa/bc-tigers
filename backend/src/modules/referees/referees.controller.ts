import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { RefereesService } from './referees.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller('referees')
export class RefereesController {
  constructor(private service: RefereesService) {}
  @Get() findAll() {
    return this.service.findAll();
  }
  @Get(':id') findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Post() @AdminOnly() create(@Body() b: Record<string, unknown>) {
    return this.service.create(b);
  }
  @Patch(':id') @AdminOnly() update(
    @Param('id') id: string,
    @Body() b: Record<string, unknown>,
  ) {
    return this.service.update(id, b);
  }
  @Delete(':id') @AdminOnly() remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
