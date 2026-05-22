import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { BracketsService } from './brackets.service';
import { AdminOnly } from '../auth/admin.decorator';

@Controller('brackets')
export class BracketsController {
  constructor(private service: BracketsService) {}

  @Get(':divisionSlug')
  getByDivision(@Param('divisionSlug') divisionSlug: string) {
    return this.service.getByDivision(divisionSlug);
  }

  @Post(':divisionId/generate')
  @AdminOnly()
  generate(@Param('divisionId') divisionId: string) {
    return this.service.generate(divisionId);
  }

  @Patch('nodes/:nodeId/advance')
  @AdminOnly()
  advance(
    @Param('nodeId') nodeId: string,
    @Body() body: { winner_id: string },
  ) {
    return this.service.advance(nodeId, body.winner_id);
  }

  @Patch('nodes/:nodeId')
  @AdminOnly()
  updateNode(
    @Param('nodeId') nodeId: string,
    @Body() body: { home_team_id?: string | null; away_team_id?: string | null; match_id?: string | null },
  ) {
    return this.service.updateNode(nodeId, body);
  }
}
