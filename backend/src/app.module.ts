import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { DivisionsModule } from './modules/divisions/divisions.module';
import { TeamsModule } from './modules/teams/teams.module';
import { PlayersModule } from './modules/players/players.module';
import { MatchesModule } from './modules/matches/matches.module';
import { StandingsModule } from './modules/standings/standings.module';
import { BracketsModule } from './modules/brackets/brackets.module';
import { VenuesModule } from './modules/venues/venues.module';
import { RefereesModule } from './modules/referees/referees.module';
import { StatsModule } from './modules/stats/stats.module';
import { MediaModule } from './modules/media/media.module';
import { UsersModule } from './modules/users/users.module';
import { GatewaysModule } from './gateways/gateways.module';
import { CoachesModule } from './modules/coaches/coaches.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HubModule } from './modules/hub/hub.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    TournamentsModule,
    DivisionsModule,
    TeamsModule,
    PlayersModule,
    MatchesModule,
    StandingsModule,
    BracketsModule,
    VenuesModule,
    RefereesModule,
    StatsModule,
    MediaModule,
    UsersModule,
    CoachesModule,
    SettingsModule,
    NotificationsModule,
    GatewaysModule,
    HubModule,
  ],
})
export class AppModule {}
