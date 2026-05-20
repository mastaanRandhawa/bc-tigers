import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { PlayersService } from './players.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller('players')
export class PlayersController {
  constructor(private service: PlayersService) {}

  @Get()
  findAll(@Query() query: { teamId?: string; page?: string; limit?: string }) {
    return this.service.findAll({
      teamId: query.teamId,
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 20),
    });
  }

  /** Accepts player UUID or legacy slug */
  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.service.findOne(idOrSlug);
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
