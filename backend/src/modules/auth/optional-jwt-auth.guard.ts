import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { isObservable, lastValueFrom, Observable } from 'rxjs';

function toPromise<T>(result: T | Promise<T> | Observable<T>): Promise<T> {
  if (isObservable(result)) {
    return lastValueFrom(result);
  }
  return Promise.resolve(result);
}

/**
 * Parses a Bearer JWT when present and attaches `req.user`, but allows the
 * request through when the token is missing or invalid. Used on public read
 * endpoints that still need to recognize admins/coaches for roster visibility.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): Promise<boolean> {
    return toPromise(super.canActivate(context)).catch(() => true);
  }

  handleRequest<TUser>(err: Error | null, user: TUser): TUser | undefined {
    if (err || !user) return undefined;
    return user;
  }
}
