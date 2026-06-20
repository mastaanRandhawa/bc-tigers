import { BadRequestException } from '@nestjs/common';

/**
 * Mass-assignment guard.
 *
 * Returns a new object containing only the allowlisted keys that are present in
 * `data`. Any field not in `allowed` (e.g. `role`, `password_hash`, `id`,
 * `created_by`) is dropped, so untrusted request bodies can never set columns
 * the endpoint does not explicitly expose.
 *
 * Throws `BadRequestException` if `data` is not a plain object.
 */
export function pickAllowed<T = Record<string, unknown>>(
  data: unknown,
  allowed: readonly string[],
): T {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new BadRequestException('Request body must be an object');
  }
  const source = data as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      out[key] = source[key];
    }
  }
  return out as T;
}
