import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import prisma from '../../prisma/prisma';
import { AuditLogService } from './audit-log.service';
import { getActorUserId } from '../../common/request-context';

type PlainRecord = Record<string, unknown> & { id: string };

type TxClient = Prisma.TransactionClient;

/**
 * Minimal structural shape of a Prisma model delegate. Resolved from a
 * transaction client so the mutation runs in the SAME transaction as its audit +
 * version writes (see {@link DelegateFactory}).
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

/**
 * Returns a model's delegate from a given (transaction) client. Services pass
 * e.g. `(tx) => asAuditable(tx.tournament)`, keeping the entity write and its
 * audit/version write inside one transaction.
 */
export type DelegateFactory = (tx: TxClient) => AuditableDelegate;

/** Cast a Prisma delegate to the auditable shape (Prisma's types are far wider). */
export function asAuditable(delegate: unknown): AuditableDelegate {
  return delegate as AuditableDelegate;
}

/**
 * Centralized create/update/soft-delete/restore/purge helpers. Each mutation and
 * its audit + immutable version row run in a SINGLE transaction, so no change can
 * ever persist without a complete audit trail (and vice versa).
 *
 * Soft-delete columns (set on the model): is_deleted, deleted_at, deleted_by,
 * record_status. Hard `delete()` is reachable ONLY via {@link purge}.
 */
@Injectable()
export class AuditableService {
  constructor(private readonly audit: AuditLogService) {}

  private tx<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => fn(tx as unknown as TxClient));
  }

  createAudited(
    getDelegate: DelegateFactory,
    entityType: string,
    data: Record<string, unknown>,
  ): Promise<PlainRecord> {
    return this.tx(async (tx) => {
      const created = await getDelegate(tx).create({ data });
      await this.audit.writeInTx(tx, {
        action: 'CREATE',
        entityType,
        entityId: created.id,
        after: created,
      });
      return created;
    });
  }

  updateAudited(
    getDelegate: DelegateFactory,
    entityType: string,
    id: string,
    data: Record<string, unknown>,
    options?: { action?: string; notes?: string },
  ): Promise<PlainRecord> {
    return this.tx(async (tx) => {
      const delegate = getDelegate(tx);
      const before = await delegate.findUnique({ where: { id } });
      if (!before) throw new NotFoundException(`${entityType} not found`);
      const after = await delegate.update({ where: { id }, data });
      await this.audit.writeInTx(tx, {
        action: options?.action ?? 'UPDATE',
        entityType,
        entityId: id,
        before,
        after,
        notes: options?.notes,
      });
      return after;
    });
  }

  /** Decommission (soft delete). Never removes the row; preserves all relations. */
  softDelete(
    getDelegate: DelegateFactory,
    entityType: string,
    id: string,
  ): Promise<PlainRecord> {
    return this.tx(async (tx) => {
      const delegate = getDelegate(tx);
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
      await this.audit.writeInTx(tx, {
        action: 'DELETE',
        entityType,
        entityId: id,
        before,
        after,
      });
      return after;
    });
  }

  /** Reverse a soft delete; relationships continue working after restoration. */
  restore(
    getDelegate: DelegateFactory,
    entityType: string,
    id: string,
  ): Promise<PlainRecord> {
    return this.tx(async (tx) => {
      const delegate = getDelegate(tx);
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
      await this.audit.writeInTx(tx, {
        action: 'RESTORE',
        entityType,
        entityId: id,
        before,
        after,
      });
      return after;
    });
  }

  /**
   * Apply a prior version's field values as a fresh update — records a NEW
   * version (RESTORE_VERSION); history is never mutated. The caller is
   * responsible for allow-listing `data` to writable fields.
   */
  restoreVersion(
    getDelegate: DelegateFactory,
    entityType: string,
    id: string,
    data: Record<string, unknown>,
    versionNumber: number,
  ): Promise<PlainRecord> {
    return this.updateAudited(getDelegate, entityType, id, data, {
      action: 'RESTORE_VERSION',
      notes: `Restored from version ${versionNumber}`,
    });
  }

  /** The ONLY hard delete. Admin-only; logged. Respects existing FK cascade rules. */
  purge(
    getDelegate: DelegateFactory,
    entityType: string,
    id: string,
  ): Promise<{ id: string }> {
    return this.tx(async (tx) => {
      const delegate = getDelegate(tx);
      const before = await delegate.findUnique({ where: { id } });
      if (!before) throw new NotFoundException(`${entityType} not found`);
      await delegate.delete({ where: { id } });
      await this.audit.logInTx(tx, {
        action: 'PURGE',
        entity: entityType,
        entityId: id,
        notes: 'Permanent hard delete (purge)',
      });
      return { id };
    });
  }
}
