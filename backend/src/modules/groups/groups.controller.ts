import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller()
export class GroupsController {
  constructor(private readonly service: GroupsService) {}

  /** Public: list a division's groups (with their teams). */
  @Get('divisions/:divisionId/groups')
  list(@Param('divisionId') divisionId: string) {
    return this.service.listByDivision(divisionId);
  }

  @Post('divisions/:divisionId/groups')
  @AdminOnly()
  create(
    @Param('divisionId') divisionId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.create(divisionId, body);
  }

  @Post('divisions/:divisionId/groups/reorder')
  @AdminOnly()
  reorder(
    @Param('divisionId') divisionId: string,
    @Body() body: { order: string[] },
  ) {
    return this.service.reorder(divisionId, body?.order ?? []);
  }

  @Post('divisions/:divisionId/groups/assign')
  @AdminOnly()
  assign(
    @Param('divisionId') divisionId: string,
    @Body()
    body: { assignments: { team_id: string; group_id: string | null }[] },
  ) {
    return this.service.assignTeams(divisionId, body?.assignments ?? []);
  }

  @Patch('groups/:id')
  @AdminOnly()
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, body);
  }

  @Delete('groups/:id')
  @AdminOnly()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
