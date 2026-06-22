import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';
import {
  getActorUserId,
  getRequestContext,
} from '../../common/request-context';

/** Fields that always change on write and would only add noise to diffs. */
const IGNORED_DIFF_FIELDS = new Set(['updated_at', 'created_at']);

/** Key substrings whose VALUES must never be persisted into audit snapshots. */
const SENSITIVE_KEY_PATTERNS = [
  'password',
  'secret',
  'token',
  'api_key',
  'apikey',
  'authorization',
  'credential',
];

/** Prisma transaction client — both the audit writes and the entity mutation
 * that triggers them run on the same `tx`, so an audit failure rolls the whole
 * operation back (no mutation can persist without its audit + version row). */
type TxClient = Prisma.TransactionClient;

type PlainRecord = Record<string, unknown>;

function toPlain(obj?: PlainRecord | null): PlainRecord | null {
  if (!obj) return null;
  // Normalize Dates/etc. to JSON-serializable values for storage + comparison.
  return JSON.parse(JSON.stringify(obj)) as PlainRecord;
}

function isSensitiveKey(key: string): boolean {
  const k = key.toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some((p) => k.includes(p));
}

/** Mask sensitive values (e.g. password_hash, tokens) before they hit storage. */
function redact(obj: PlainRecord | null): PlainRecord | null {
  if (!obj) return obj;
  const out: PlainRecord = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key] = isSensitiveKey(key) ? '[REDACTED]' : value;
  }
  return out;
}

/** Names of fields that differ between two record snapshots (ignoring noise). */
function changedFieldNames(
  before: PlainRecord | null,
  after: PlainRecord | null,
): string[] {
  const keys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);
  const changed: string[] = [];
  for (const key of keys) {
    if (IGNORED_DIFF_FIELDS.has(key)) continue;
    if (
      JSON.stringify(before?.[key] ?? null) !==
      JSON.stringify(after?.[key] ?? null)
    ) {
      changed.push(key);
    }
  }
  return changed;
}

@Injectable()
export class AuditLogService {
  findAll(params?: {
    userId?: string;
    entity?: string;
    entityId?: string;
    action?: string;
    source?: string;
    limit?: number;
  }) {
    const { limit = 50 } = params ?? {};
    return prisma.auditLog.findMany({
      where: {
        ...(params?.userId ? { user_id: params.userId } : {}),
        ...(params?.entity ? { entity: params.entity } : {}),
        ...(params?.entityId ? { entity_id: params.entityId } : {}),
        ...(params?.action ? { action: params.action } : {}),
        ...(params?.source ? { source: params.source } : {}),
      },
      include: {
        user: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  /** Immutable, ordered version history for a single record. */
  listVersions(entityType: string, entityId: string) {
    return prisma.recordVersion.findMany({
      where: { entity_type: entityType, entity_id: entityId },
      include: {
        user: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
      orderBy: { version: 'desc' },
    });
  }

  getVersion(id: string) {
    return prisma.recordVersion.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
      },
    });
  }

  /**
   * Append an immutable RecordVersion + enriched AuditLog row **inside the
   * caller's transaction** (`tx`). Because the entity mutation and these writes
   * share one transaction, a failure here rolls the mutation back too — no
   * untracked changes are possible. Sensitive field VALUES are redacted before
   * storage; the changed-field list is still computed from the raw values so
   * "password_hash changed" is recorded without revealing it.
   */
  async writeInTx(
    tx: TxClient,
    params: {
      action: string;
      entityType: string;
      entityId: string;
      before?: PlainRecord | null;
      after?: PlainRecord | null;
      notes?: string;
    },
  ) {
    const ctx = getRequestContext();
    const userId = getActorUserId() ?? null;
    const rawOld = toPlain(params.before);
    const rawNew = toPlain(params.after);
    const changedFields = changedFieldNames(rawOld, rawNew);
    const oldValues = redact(rawOld);
    const newValues = redact(rawNew);

    const latest = await tx.recordVersion.findFirst({
      where: { entity_type: params.entityType, entity_id: params.entityId },
      orderBy: { version: 'desc' },
      select: { id: true, version: true },
    });
    const version = (latest?.version ?? 0) + 1;

    const recordVersion = await tx.recordVersion.create({
      data: {
        entity_type: params.entityType,
        entity_id: params.entityId,
        version,
        previous_version_id: latest?.id ?? null,
        action: params.action,
        changed_fields: changedFields,
        old_values: (oldValues ?? undefined) as Prisma.InputJsonValue,
        new_values: (newValues ?? undefined) as Prisma.InputJsonValue,
        user_id: userId,
      },
    });

    await tx.auditLog.create({
      data: {
        user_id: userId,
        action: params.action,
        entity: params.entityType,
        entity_id: params.entityId,
        previous_values: (oldValues ?? undefined) as Prisma.InputJsonValue,
        new_values: (newValues ?? undefined) as Prisma.InputJsonValue,
        metadata: { version },
        ip_address: ctx?.ip,
        user_agent: ctx?.userAgent,
        request_id: ctx?.requestId,
        source: ctx?.source,
        notes: params.notes,
      },
    });

    return recordVersion;
  }

  /** Standalone audit write (opens its own transaction). */
  record(params: {
    action: string;
    entityType: string;
    entityId: string;
    before?: PlainRecord | null;
    after?: PlainRecord | null;
    notes?: string;
  }) {
    return prisma.$transaction((tx) =>
      this.writeInTx(tx as unknown as TxClient, params),
    );
  }

  /** AuditLog entry inside an existing transaction (used by atomic purge). */
  logInTx(
    tx: TxClient,
    params: {
      userId?: string;
      action: string;
      entity: string;
      entityId?: string;
      metadata?: Prisma.InputJsonValue;
      notes?: string;
    },
  ) {
    const ctx = getRequestContext();
    return tx.auditLog.create({
      data: {
        user_id: params.userId ?? getActorUserId() ?? null,
        action: params.action,
        entity: params.entity,
        entity_id: params.entityId,
        metadata: params.metadata,
        ip_address: ctx?.ip,
        user_agent: ctx?.userAgent,
        request_id: ctx?.requestId,
        source: ctx?.source,
        notes: params.notes,
      },
    });
  }

  /**
   * Lightweight audit entry for non-entity / system events (LOGIN, EXPORT,
   * GENERATION, …). Enriches with request context automatically.
   */
  log(params: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
    notes?: string;
  }) {
    const ctx = getRequestContext();
    return prisma.auditLog.create({
      data: {
        user_id: params.userId ?? getActorUserId() ?? null,
        action: params.action,
        entity: params.entity,
        entity_id: params.entityId,
        metadata: params.metadata,
        ip_address: ctx?.ip,
        user_agent: ctx?.userAgent,
        request_id: ctx?.requestId,
        source: ctx?.source,
        notes: params.notes,
      },
    });
  }
}
