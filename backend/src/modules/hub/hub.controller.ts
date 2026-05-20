import { Controller, Get, Header } from '@nestjs/common';
import { HubService } from './hub.service';

@Controller('hub')
export class HubController {
  constructor(private readonly hubService: HubService) {}

  @Get('home')
  @Header('Cache-Control', 'public, max-age=15, stale-while-revalidate=30')
  getHome() {
    return this.hubService.getHomeFeed();
  }
}
