import { AsyncLocalStorage } from 'node:async_hooks';

/** Scope for soft-delete read filtering (admin-controllable per request). */
export type RecordScope = 'active' | 'deleted' | 'all';

/**
 * Per-request ambient context. Populated by RequestContextMiddleware and read by
 * the centralized audit writer and the soft-delete Prisma extension so neither
 * needs request params threaded through every service call.
 *
 * `req` is the raw request reference: the authenticated user is attached later
 * (by the JWT guard, which runs after middleware), so the actor is resolved
 * lazily from `req.user` at log time.
 */
export interface RequestContextStore {
  requestId: string;
  ip?: string;
  userAgent?: string;
  source: string; // Web | Mobile | API | BackgroundJob
  scope: RecordScope;
  req?: { user?: { userId?: string } };
}

const storage = new AsyncLocalStorage<RequestContextStore>();

export function runWithRequestContext<T>(
  store: RequestContextStore,
  fn: () => T,
): T {
  return storage.run(store, fn);
}

export function getRequestContext(): RequestContextStore | undefined {
  return storage.getStore();
}

/** The acting user's id, resolved lazily from the request (set by the JWT guard). */
export function getActorUserId(): string | undefined {
  return storage.getStore()?.req?.user?.userId;
}

export function getScope(): RecordScope {
  return storage.getStore()?.scope ?? 'active';
}

/** Admin endpoints call this to widen reads to deleted/all for the current request. */
export function setScope(scope: RecordScope): void {
  const store = storage.getStore();
  if (store) store.scope = scope;
}
