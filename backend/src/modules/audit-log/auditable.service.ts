import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { getActorUserId } from '../../common/request-context';

type PlainRecord = Record<string, unknown> & { id: string };

/**
 * Minimal structural shape of a Prisma model delegate. Services pass their
 * `prisma.<model>` delegate (cast via `asAuditable`) so this stays generic and
 * every future entity can reuse it without bespoke audit/soft-delete logic.
 */
export interface AuditableDelegate {
  findUnique(args: { where: { id: string } }): Promise<PlainRecord | null>;
  create(args: { data: Record<string, unknown> }): Promise<PlainRecord>;
  update(args: {
    where: { id: string };
    data: Record<string, unknown>;
  }): Promise<PlainRecord>;
  delete(args: { where: { id: string } }): Promise<PlainRecord>;
}

/** Cast a Prisma delegate to the auditable shape (Prisma's types are far wider). */
export function asAuditable(delegate: unknown): AuditableDelegate {
  return delegate as AuditableDelegate;
}

/**
 * Centralized create/update/soft-delete/restore/purge helpers. Each mutation is
 * recorded through {@link AuditLogService.record}, giving every entity audit
 * trail + immutable version history + reversible soft-delete for free.
 *
 * Soft-delete columns (set on the model): is_deleted, deleted_at, deleted_by,
 * record_status. Hard `delete()` is reachable ONLY via {@link purge}.
 */
@Injectable()
export class AuditableService {
  constructor(private readonly audit: AuditLogService) {}

  async createAudited(
    delegate: AuditableDelegate,
    entityType: string,
    data: Record<string, unknown>,
  ): Promise<PlainRecord> {
    const created = await delegate.create({ data });
    await this.audit.record({
      action: 'CREATE',
      entityType,
      entityId: created.id,
      after: created,
    });
    return created;
  }

  async updateAudited(
    delegate: AuditableDelegate,
    entityType: string,
    id: string,
    data: Record<string, unknown>,
    options?: { action?: string; notes?: string },
  ): Promise<PlainRecord> {
    const before = await delegate.findUnique({ where: { id } });
    if (!before) throw new NotFoundException(`${entityType} not found`);
    const after = await delegate.update({ where: { id }, data });
    await this.audit.record({
      action: options?.action ?? 'UPDATE',
      entityType,
      entityId: id,
      before,
      after,
      notes: options?.notes,
    });
    return after;
  }

  /** Decommission (soft delete). Never removes the row; preserves all relations. */
  async softDelete(
    delegate: AuditableDelegate,
    entityType: string,
    id: string,
  ): Promise<PlainRecord> {
    const before = await delegate.findUnique({ where: { id } });
    if (!before) throw new NotFoundException(`${entityType} not found`);
    if (before.is_deleted) return before; // idempotent

    const after = await delegate.update({
      where: { id },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
        deleted_by: getActorUserId() ?? null,
        record_status: 'DECOMMISSIONED',
      },
    });
    await this.audit.record({
      action: 'DELETE',
      entityType,
      entityId: id,
      before,
      after,
    });
    return after;
  }

  /** Reverse a soft delete; relationships continue working after restoration. */
  async restore(
    delegate: AuditableDelegate,
    entityType: string,
    id: string,
  ): Promise<PlainRecord> {
    const before = await delegate.findUnique({ where: { id } });
    if (!before) throw new NotFoundException(`${entityType} not found`);

    const after = await delegate.update({
      where: { id },
      data: {
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
        record_status: 'ACTIVE',
      },
    });
    await this.audit.record({
      action: 'RESTORE',
      entityType,
      entityId: id,
      before,
      after,
    });
    return after;
  }

  /**
   * Apply a prior version's field values as a fresh update — records a NEW
   * version (RESTORE_VERSION); history is never mutated. The caller is
   * responsible for allow-listing `data` to writable fields.
   */
  async restoreVersion(
    delegate: AuditableDelegate,
    entityType: string,
    id: string,
    data: Record<string, unknown>,
    versionNumber: number,
  ): Promise<PlainRecord> {
    return this.updateAudited(delegate, entityType, id, data, {
      action: 'RESTORE_VERSION',
      notes: `Restored from version ${versionNumber}`,
    });
  }

  /** The ONLY hard delete. Admin-only; logged. Respects existing FK cascade rules. */
  async purge(
    delegate: AuditableDelegate,
    entityType: string,
    id: string,
  ): Promise<{ id: string }> {
    const before = await delegate.findUnique({ where: { id } });
    if (!before) throw new NotFoundException(`${entityType} not found`);
    await delegate.delete({ where: { id } });
    await this.audit.log({
      action: 'PURGE',
      entity: entityType,
      entityId: id,
      notes: 'Permanent hard delete (purge)',
    });
    return { id };
  }
}
