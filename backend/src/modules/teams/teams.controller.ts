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
import { TeamsService } from './teams.service';
import { AdminOnly } from '../auth/admin.decorator';
import { setScope, type RecordScope } from '../../common/request-context';

@Controller('teams')
export class TeamsController {
  constructor(private service: TeamsService) {}

  /** Admin list with active/deleted/all scope toggle. */
  @Get()
  @AdminOnly()
  findAll(
    @Query('divisionId') divisionId?: string,
    @Query('scope') scope?: RecordScope,
  ) {
    setScope(scope ?? 'active');
    return this.service.findAll({ divisionId });
  }

  /** Public — teams without a coach, for the coach-registration picker. */
  @Get('directory')
  directory() {
    return this.service.directory();
  }

  /** Immutable version + audit history for one team. */
  @Get(':id/history')
  @AdminOnly()
  history(@Param('id') id: string) {
    return this.service.history(id);
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

  @Post(':id/divisions')
  @AdminOnly()
  addToDivision(
    @Param('id') id: string,
    @Body() body: { division_id: string; slug?: string; group_id?: string | null },
  ) {
    return this.service.addToDivision(id, body.division_id, {
      slug: body.slug,
      group_id: body.group_id,
    });
  }

  @Delete(':id/divisions/:divisionId')
  @AdminOnly()
  removeFromDivision(
    @Param('id') id: string,
    @Param('divisionId') divisionId: string,
  ) {
    return this.service.removeFromDivision(id, divisionId);
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

  /** Permanent hard delete — admin only. */
  @Delete(':id/purge')
  @AdminOnly()
  purge(@Param('id') id: string) {
    return this.service.purge(id);
  }

  /** Soft delete (decommission). */
  @Delete(':id')
  @AdminOnly()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
