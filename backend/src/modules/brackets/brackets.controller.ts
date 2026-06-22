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
import type { BracketSeeding } from './bracket-seeding';

@Controller('brackets')
export class BracketsController {
  constructor(private service: BracketsService) {}

  @Get('validate/:divisionId')
  @AdminOnly()
  validate(@Param('divisionId') divisionId: string) {
    return this.service.validateGeneration(divisionId);
  }

  @Get('division/:divisionId')
  getByDivisionId(@Param('divisionId') divisionId: string) {
    return this.service.getByDivisionId(divisionId);
  }

  @Post(':divisionId/generate')
  @AdminOnly()
  generate(
    @Param('divisionId') divisionId: string,
    @Body() body: { seeding?: BracketSeeding },
  ) {
    return this.service.generate(divisionId, body);
  }

  @Post(':divisionId/randomize')
  @AdminOnly()
  randomize(@Param('divisionId') divisionId: string) {
    return this.service.randomize(divisionId);
  }

  @Patch(':divisionId/lock')
  @AdminOnly()
  setLock(
    @Param('divisionId') divisionId: string,
    @Body() body: { locked: boolean },
  ) {
    return this.service.setBracketLock(divisionId, body.locked);
  }

  @Patch(':divisionId/finalize')
  @AdminOnly()
  finalize(@Param('divisionId') divisionId: string) {
    return this.service.finalizeBracket(divisionId);
  }

  @Patch(':divisionId/unfinalize')
  @AdminOnly()
  unfinalize(@Param('divisionId') divisionId: string) {
    return this.service.unfinalizeBracket(divisionId);
  }

  @Post(':divisionId/assign-teams')
  @AdminOnly()
  assignTeams(
    @Param('divisionId') divisionId: string,
    @Body() body: { team_ids: string[] },
  ) {
    return this.service.assignTeamsToFirstRound(divisionId, body.team_ids);
  }

  @Patch('nodes/:nodeId/advance')
  @AdminOnly()
  advance(
    @Param('nodeId') nodeId: string,
    @Body() body: { winner_id: string },
  ) {
    return this.service.advance(nodeId, body.winner_id);
  }

  @Patch('nodes/:nodeId/place')
  @AdminOnly()
  placeTeam(
    @Param('nodeId') nodeId: string,
    @Body() body: { team_id: string; slot: 'home' | 'away' },
  ) {
    return this.service.placeTeam(nodeId, body.slot, body.team_id);
  }

  @Patch('nodes/swap')
  @AdminOnly()
  swapMatches(@Body() body: { node_id_a: string; node_id_b: string }) {
    return this.service.swapMatches(body.node_id_a, body.node_id_b);
  }

  @Patch('nodes/:nodeId')
  @AdminOnly()
  updateNode(
    @Param('nodeId') nodeId: string,
    @Body() body: { home_team_id?: string | null; away_team_id?: string | null; match_id?: string | null },
  ) {
    return this.service.updateNode(nodeId, body);
  }

  @Post(':divisionId/restore')
  @AdminOnly()
  restore(
    @Param('divisionId') divisionId: string,
    @Body()
    body: {
      snapshot: Array<{
        id: string;
        home_team_id?: string | null;
        away_team_id?: string | null;
        winner_id?: string | null;
      }>;
    },
  ) {
    return this.service.restoreSnapshot(divisionId, body.snapshot);
  }
}
