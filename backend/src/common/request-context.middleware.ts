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
    // Express's `get()` returns a well-typed `string | undefined` (avoids the
    // raw header-index union/any).
    const requestId = req.get('x-request-id') || randomUUID();
    const source = req.get('x-client-source') || 'Web';
    const userAgent = req.get('user-agent');

    res.setHeader('x-request-id', requestId);

    runWithRequestContext(
      {
        requestId,
        ip: req.ip,
        userAgent,
        source,
        scope: 'active',
        // `req` is mutated by the JWT guard later; we read req.user lazily.
        req,
      },
      () => next(),
    );
  }
}
