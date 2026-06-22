import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { StandingsService } from '../modules/standings/standings.service';
import { BracketsService } from '../modules/brackets/brackets.service';
import { getCorsOrigins } from '../common/cors-origins';

export const SOCKET_EVENTS = {
  MATCH_STARTED: 'match:started',
  MATCH_UPDATED: 'match:updated',
  MATCH_COMPLETED: 'match:completed',
  GOAL_SCORED: 'match:goal',
  CARD_ISSUED: 'match:card',
  SUBSTITUTION: 'match:substitution',
  STANDINGS_UPDATED: 'standings:updated',
  BRACKET_UPDATED: 'bracket:updated',
} as const;

@WebSocketGateway({
  cors: { origin: getCorsOrigins(), credentials: true },
  namespace: '/',
})
export class MatchesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MatchesGateway.name);

  constructor(
    private standingsService: StandingsService,
    private bracketsService: BracketsService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:match')
  handleJoinMatch(
    @MessageBody() matchId: string,
    @ConnectedSocket() client: Socket,
  ) {
    void client.join(`match:${matchId}`);
    this.logger.log(`Client ${client.id} joined room match:${matchId}`);
  }

  @SubscribeMessage('leave:match')
  handleLeaveMatch(
    @MessageBody() matchId: string,
    @ConnectedSocket() client: Socket,
  ) {
    void client.leave(`match:${matchId}`);
  }

  @SubscribeMessage('join:division')
  handleJoinDivision(
    @MessageBody() divisionId: string,
    @ConnectedSocket() client: Socket,
  ) {
    void client.join(`division:${divisionId}`);
  }

  /** Called by MatchesService when a match event is recorded */
  emitMatchEvent(event: {
    matchId: string;
    divisionId: string;
    type: string;
    data: unknown;
  }) {
    const eventName =
      event.type === 'GOAL' || event.type === 'OWN_GOAL'
        ? SOCKET_EVENTS.GOAL_SCORED
        : event.type === 'YELLOW_CARD' || event.type === 'RED_CARD'
          ? SOCKET_EVENTS.CARD_ISSUED
          : event.type === 'SUBSTITUTION'
            ? SOCKET_EVENTS.SUBSTITUTION
            : SOCKET_EVENTS.MATCH_UPDATED;

    this.server.to(`match:${event.matchId}`).emit(eventName, event.data);
  }

  emitMatchStarted(matchId: string, data: unknown) {
    this.server.to(`match:${matchId}`).emit(SOCKET_EVENTS.MATCH_STARTED, data);
    this.server.emit(SOCKET_EVENTS.MATCH_UPDATED, data);
  }

  async emitMatchCompleted(matchId: string, divisionId: string, data: unknown) {
    this.server
      .to(`match:${matchId}`)
      .emit(SOCKET_EVENTS.MATCH_COMPLETED, data);
    this.server.emit(SOCKET_EVENTS.MATCH_UPDATED, data);

    // Auto-recalculate standings
    try {
      const updatedStandings =
        await this.standingsService.recalculate(divisionId);
      this.server
        .to(`division:${divisionId}`)
        .emit(SOCKET_EVENTS.STANDINGS_UPDATED, updatedStandings);
      this.server.emit(SOCKET_EVENTS.STANDINGS_UPDATED, {
        divisionId,
        standings: updatedStandings,
      });
    } catch (err) {
      this.logger.error('Failed to recalculate standings', err);
    }
  }

  emitScoreUpdate(matchId: string, homeScore: number, awayScore: number) {
    this.server.to(`match:${matchId}`).emit(SOCKET_EVENTS.MATCH_UPDATED, {
      matchId,
      home_score: homeScore,
      away_score: awayScore,
    });
    this.server.emit(SOCKET_EVENTS.MATCH_UPDATED, {
      matchId,
      home_score: homeScore,
      away_score: awayScore,
    });
  }

  /**
   * Recalculate standings for a division and broadcast the result. Used when a
   * match that is *already* COMPLETED has its score/events edited — the
   * completion event already fired, but the table still needs to be corrected.
   */
  async refreshStandings(divisionId: string) {
    try {
      const updatedStandings =
        await this.standingsService.recalculate(divisionId);
      this.server
        .to(`division:${divisionId}`)
        .emit(SOCKET_EVENTS.STANDINGS_UPDATED, updatedStandings);
      this.server.emit(SOCKET_EVENTS.STANDINGS_UPDATED, {
        divisionId,
        standings: updatedStandings,
      });
    } catch (err) {
      this.logger.error('Failed to refresh standings', err);
    }
  }

  emitBracketUpdated(divisionId: string, data: unknown) {
    this.server
      .to(`division:${divisionId}`)
      .emit(SOCKET_EVENTS.BRACKET_UPDATED, data);
    this.server.emit(SOCKET_EVENTS.BRACKET_UPDATED, data);
  }
}
