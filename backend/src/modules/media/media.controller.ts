import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller('media')
export class MediaController {
  constructor(private service: MediaService) {}

  @Get()
  findAll(@Query() q: { tournamentId?: string; divisionId?: string }) {
    return this.service.findAll(q);
  }

  @Post('upload')
  @AdminOnly()
  create(@Body() body: Record<string, unknown>) {
    return this.service.create(body);
  }

  @Delete(':id')
  @AdminOnly()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
