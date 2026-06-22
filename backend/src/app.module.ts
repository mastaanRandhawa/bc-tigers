import {
  Module,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { RequestContextMiddleware } from './common/request-context.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { DivisionsModule } from './modules/divisions/divisions.module';
import { TeamsModule } from './modules/teams/teams.module';
import { MatchesModule } from './modules/matches/matches.module';
import { StandingsModule } from './modules/standings/standings.module';
import { BracketsModule } from './modules/brackets/brackets.module';
import { VenuesModule } from './modules/venues/venues.module';
import { PointFormatsModule } from './modules/point-formats/point-formats.module';
import { UsersModule } from './modules/users/users.module';
import { GatewaysModule } from './gateways/gateways.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { HubModule } from './modules/hub/hub.module';
import { MailModule } from './modules/mail/mail.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { HealthModule } from './modules/health/health.module';
import { CoachModule } from './modules/coach/coach.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Global baseline rate limit (per IP). Auth endpoints add a tighter limit
    // via @Throttle on the controller. See AuthController.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    MailModule,
    HealthModule,
    AuthModule,
    TournamentsModule,
    DivisionsModule,
    TeamsModule,
    MatchesModule,
    StandingsModule,
    BracketsModule,
    VenuesModule,
    PointFormatsModule,
    UsersModule,
    SettingsModule,
    AnnouncementsModule,
    GatewaysModule,
    HubModule,
    AuditLogModule,
    CoachModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Establish per-request audit context for every route.
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
