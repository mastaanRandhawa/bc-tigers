import { Prisma } from '@prisma/client';
import { getScope } from '../common/request-context';

/**
 * Models that carry the soft-delete columns (deleted_at/deleted_by/is_deleted/
 * record_status). Add a model name here when it gains the soft-delete pattern —
 * read filtering then applies automatically, no per-query changes needed.
 */
export const SOFT_DELETE_MODELS = new Set<string>(['Tournament', 'Team']);

/** Read operations where injecting a non-unique `where` filter is valid. */
const SCOPED_READ_OPERATIONS = new Set<string>([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'count',
  'aggregate',
  'groupBy',
]);

/**
 * Prisma client extension that auto-hides soft-deleted rows from list/read
 * queries based on the per-request scope (default `active`). Admin endpoints can
 * widen the scope to `deleted` or `all` via the request context.
 *
 * NOTE: `findUnique`/`findUniqueOrThrow` are intentionally not scoped — Prisma
 * forbids extra `where` filters there. Public single-record lookups that must
 * hide deleted rows use `findFirst` with an explicit filter instead.
 */
export const softDeleteExtension = Prisma.defineExtension({
  name: 'soft-delete-read-scope',
  query: {
    $allModels: {
      $allOperations({ model, operation, args, query }) {
        if (
          !model ||
          !SOFT_DELETE_MODELS.has(model) ||
          !SCOPED_READ_OPERATIONS.has(operation)
        ) {
          return query(args);
        }

        const scope = getScope();
        if (scope === 'all') return query(args);

        const filter = { is_deleted: scope === 'deleted' };
        const typedArgs = (args ?? {}) as { where?: Record<string, unknown> };
        typedArgs.where = { ...(typedArgs.where ?? {}), ...filter };
        return query(typedArgs);
      },
    },
  },
});
