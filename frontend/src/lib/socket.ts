import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: {
        token: localStorage.getItem('bc_token') ?? '',
      },
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// ─── Event names ──────────────────────────────────────────────────────────────
export const SOCKET_EVENTS = {
  MATCH_STARTED: 'match:started',
  MATCH_UPDATED: 'match:updated',
  MATCH_COMPLETED: 'match:completed',
  GOAL_SCORED: 'match:goal',
  CARD_ISSUED: 'match:card',
  SUBSTITUTION: 'match:substitution',
  STANDINGS_UPDATED: 'standings:updated',
  BRACKET_UPDATED: 'bracket:updated',
  NOTIFICATION: 'notification',
} as const;
