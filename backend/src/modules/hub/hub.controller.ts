import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { HubService } from './hub.service';

@Controller('hub')
export class HubController {
  constructor(private readonly hubService: HubService) {}

  @Get('home')
  @Header('Cache-Control', 'public, max-age=15, stale-while-revalidate=30')
  getHome() {
    return this.hubService.getHomeFeed();
  }

  @Get('live-matches')
  @Header('Cache-Control', 'public, max-age=5, stale-while-revalidate=10')
  getLiveMatches(@Query('divisionId') divisionId?: string) {
    return this.hubService.getLiveMatches(divisionId);
  }

  @Get('resolve-division/:divisionSlug')
  @Header('Cache-Control', 'public, max-age=60')
  resolveDivision(@Param('divisionSlug') divisionSlug: string) {
    return this.hubService.resolveDivisionSlug(divisionSlug);
  }
}
