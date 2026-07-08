import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { AdminOnly } from '../auth/admin.decorator';
import { setScope, type RecordScope } from '../../common/request-context';

@Controller('tournaments')
export class TournamentsController {
  constructor(private service: TournamentsService) {}

  /** Public list — always active-scoped (deleted records hidden). */
  @Get()
  findAll(@Query() query: { status?: string; page?: string; limit?: string }) {
    return this.service.findAll({
      status: query.status,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
    });
  }

  /** Admin list with active/deleted/all scope toggle. */
  @Get('manage')
  @AdminOnly()
  findAllManaged(
    @Query()
    query: {
      scope?: RecordScope;
      status?: string;
      page?: string;
      limit?: string;
    },
  ) {
    setScope(query.scope ?? 'active');
    return this.service.findAll({
      status: query.status,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 200,
    });
  }

  @Get('by-id/:id')
  @AdminOnly()
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  /** Immutable version + audit history for one tournament. */
  @Get(':id/history')
  @AdminOnly()
  history(@Param('id') id: string) {
    return this.service.history(id);
  }

  @Get(':slug/overview')
  getOverview(@Param('slug') slug: string) {
    return this.service.getOverview(slug);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.service.findOne(slug);
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

  @Post(':id/complete')
  @AdminOnly()
  complete(@Param('id') id: string) {
    return this.service.complete(id);
  }

  @Post(':id/enable-editing')
  @AdminOnly()
  enableEditing(@Param('id') id: string) {
    return this.service.enableEditing(id);
  }

  @Post(':id/restore')
  @AdminOnly()
  restore(@Param('id') id: string) {
    return this.service.restore(id);
  }

  @Post(':id/restore-version/:versionId')
  @AdminOnly()
  restoreVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.service.restoreVersion(id, versionId);
  }

  /** Soft delete (decommission). */
  @Delete(':id/purge')
  @AdminOnly()
  purge(@Param('id') id: string) {
    return this.service.purge(id);
  }

  @Delete(':id')
  @AdminOnly()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
