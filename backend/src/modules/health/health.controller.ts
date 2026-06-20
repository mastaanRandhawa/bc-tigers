import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import prisma from '../../prisma/prisma';

@Controller('health')
export class HealthController {
  @Get()
  async check() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'up', timestamp: new Date().toISOString() };
    } catch {
      throw new ServiceUnavailableException({
        status: 'degraded',
        db: 'down',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
