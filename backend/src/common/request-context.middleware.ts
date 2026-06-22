import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { runWithRequestContext } from './request-context';

/**
 * Establishes the per-request audit context for every HTTP request. Generates
 * (or honors) a request id, captures client metadata, and runs the remainder of
 * the request inside the AsyncLocalStorage store so the audit writer + soft-delete
 * extension can read it without explicit plumbing.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incomingId = req.headers['x-request-id'];
    const requestId =
      (Array.isArray(incomingId) ? incomingId[0] : incomingId) || randomUUID();

    const sourceHeader = req.headers['x-client-source'];
    const source =
      (Array.isArray(sourceHeader) ? sourceHeader[0] : sourceHeader) || 'Web';

    const userAgent = req.headers['user-agent'];

    res.setHeader('x-request-id', requestId);

    runWithRequestContext(
      {
        requestId,
        ip: req.ip,
        userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
        source,
        scope: 'active',
        // `req` is mutated by the JWT guard later; we read req.user lazily.
        req: req as unknown as { user?: { userId?: string } },
      },
      () => next(),
    );
  }
}
