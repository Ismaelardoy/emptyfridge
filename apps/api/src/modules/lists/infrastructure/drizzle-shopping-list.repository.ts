import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm';
import type { Database, Transaction } from '../../../shared/db/client';
import { DATABASE } from '../../../shared/db/database.module';
import { isUniqueViolation } from '../../../shared/db/errors';
import { items, lists, users } from '../../../shared/db/schema';
import type { MemberRef } from '../../../shared/domain/member-ref';
import type { IdGenerator } from '../../../shared/domain/ports';
import { ID_GENERATOR } from '../../../shared/domain/ports';
import { AppError } from '../../../shared/errors/app-error';
import type {
  NewItemRecord,
  ProductUsageRow,
  ShoppingListRepository,
  UpdateItemPatch,
} from '../domain/ports';
import type {
  FinishResult,
  FinishedListSummary,
  ReopenResult,
  ShoppingItem,
  ShoppingList,
  Unit,
} from '../domain/shopping-list';

type ListRow = typeof lists.$inferSelect;
type ItemRow = typeof items.$inferSelect;

function toList(row: ListRow, closedBy: MemberRef | null): ShoppingList {
  return {
    id: row.id,
    householdId: row.householdId,
    status: row.status,
    createdAt: row.createdAt,
    closedAt: row.closedAt,
    closedBy,
  };
}

function toItem(row: ItemRow, addedBy: MemberRef | null): ShoppingItem {
  return {
    id: row.id,
    listId: row.listId,
    name: row.name,
    normalizedName: row.normalizedName,
    quantity: row.quantity,
    // La columna es text; la API solo escribe unidades validadas por Zod.
    unit: row.unit as Unit | null,
    checked: row.checked,
    addedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function memberRef(id: string | null, displayName: string | null): MemberRef | null {
  return id && displayName ? { id, displayName } : null;
}

async function ensureOpenTx(
  tx: Transaction,
  householdId: string,
  now: Date,
  ids: IdGenerator,
): Promise<ShoppingList> {
  const [created] = await tx
    .insert(lists)
    .values({ id: ids.next(), householdId, status: 'open', createdAt: now })
    .onConflictDoNothing()
    .returning();

  if (created) {
    return toList(created, null);
  }

  const [existing] = await tx
    .select()
    .from(lists)
    .where(and(eq(lists.householdId, householdId), eq(lists.status, 'open')))
    .limit(1);

  if (!existing) {
    throw new Error('No se pudo crear ni encontrar la lista abierta.');
  }

  return toList(existing, null);
}

@Injectable()
export class DrizzleShoppingListRepository implements ShoppingListRepository {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
  ) {}

  async findOpen(householdId: string): Promise<ShoppingList | null> {
    const [row] = await this.db
      .select()
      .from(lists)
      .where(and(eq(lists.householdId, householdId), eq(lists.status, 'open')))
      .limit(1);

    return row ? toList(row, null) : null;
  }

  async ensureOpen(householdId: string, now: Date): Promise<ShoppingList> {
    return this.db.transaction((tx) => ensureOpenTx(tx, householdId, now, this.ids));
  }

  async listItems(listId: string): Promise<ShoppingItem[]> {
    const rows = await this.db
      .select({ item: items, addedByName: users.displayName })
      .from(items)
      .leftJoin(users, eq(users.id, items.addedBy))
      .where(eq(items.listId, listId))
      .orderBy(asc(items.checked), desc(items.createdAt));

    return rows.map((row) => toItem(row.item, memberRef(row.item.addedBy, row.addedByName)));
  }

  async findOpenItemByNormalizedName(
    listId: string,
    normalizedName: string,
  ): Promise<ShoppingItem | null> {
    const [row] = await this.db
      .select({ item: items, addedByName: users.displayName })
      .from(items)
      .leftJoin(users, eq(users.id, items.addedBy))
      .where(
        and(
          eq(items.listId, listId),
          eq(items.normalizedName, normalizedName),
          eq(items.checked, false),
        ),
      )
      .limit(1);

    return row ? toItem(row.item, memberRef(row.item.addedBy, row.addedByName)) : null;
  }

  async addItem(record: NewItemRecord): Promise<{ item: ShoppingItem; created: boolean }> {
    const [row] = await this.db
      .insert(items)
      .values({
        id: this.ids.next(),
        listId: record.listId,
        name: record.name,
        normalizedName: record.normalizedName,
        quantity: record.quantity,
        unit: record.unit,
        checked: false,
        addedBy: record.addedBy.id,
        createdAt: record.createdAt,
        updatedAt: record.createdAt,
      })
      // El índice único parcial de pendientes cubre esta carrera.
      .onConflictDoNothing()
      .returning();

    if (row) {
      return { item: toItem(row, record.addedBy), created: true };
    }

    const existing = await this.findOpenItemByNormalizedName(record.listId, record.normalizedName);
    if (existing) {
      return { item: existing, created: false };
    }

    throw new Error('No se pudo crear el producto.');
  }

  async updateItem(
    householdId: string,
    itemId: string,
    patch: UpdateItemPatch,
  ): Promise<ShoppingItem | null> {
    const [current] = await this.db
      .select({ item: items, addedByName: users.displayName })
      .from(items)
      .innerJoin(lists, eq(lists.id, items.listId))
      .leftJoin(users, eq(users.id, items.addedBy))
      .where(
        and(eq(items.id, itemId), eq(lists.householdId, householdId), eq(lists.status, 'open')),
      )
      .limit(1);

    if (!current) {
      return null;
    }

    try {
      const [row] = await this.db.update(items).set(patch).where(eq(items.id, itemId)).returning();

      return row ? toItem(row, memberRef(current.item.addedBy, current.addedByName)) : null;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw AppError.conflict(
          'ITEM_NAME_TAKEN',
          'Ya hay un producto pendiente con ese nombre en la lista.',
        );
      }
      throw error;
    }
  }

  async deleteItem(householdId: string, itemId: string): Promise<boolean> {
    const [current] = await this.db
      .select({ id: items.id })
      .from(items)
      .innerJoin(lists, eq(lists.id, items.listId))
      .where(
        and(eq(items.id, itemId), eq(lists.householdId, householdId), eq(lists.status, 'open')),
      )
      .limit(1);

    if (!current) {
      return false;
    }

    await this.db.delete(items).where(eq(items.id, itemId));
    return true;
  }

  async finish(householdId: string, actorId: string, now: Date): Promise<FinishResult | null> {
    return this.db.transaction(async (tx) => {
      // Bloquea la lista abierta para que dos "finalizar" simultáneos no
      // cierren dos veces la misma compra.
      const [open] = await tx
        .select()
        .from(lists)
        .where(and(eq(lists.householdId, householdId), eq(lists.status, 'open')))
        .limit(1)
        .for('update');

      if (!open) {
        return null;
      }

      // No tocamos los checks: al revertir, la compra vuelve tal y como estaba.
      await tx
        .update(lists)
        .set({ status: 'done', closedAt: now, closedBy: actorId })
        .where(eq(lists.id, open.id));

      return { closedListId: open.id };
    });
  }

  async reopen(
    householdId: string,
    listId: string,
    now: Date,
    windowMs: number,
  ): Promise<ReopenResult> {
    return this.db.transaction(async (tx) => {
      const [open] = await tx
        .select({ id: lists.id })
        .from(lists)
        .where(and(eq(lists.householdId, householdId), eq(lists.status, 'open')))
        .limit(1)
        .for('update');

      if (open) {
        return 'already-open';
      }

      const [target] = await tx
        .select()
        .from(lists)
        .where(
          and(eq(lists.id, listId), eq(lists.householdId, householdId), eq(lists.status, 'done')),
        )
        .limit(1)
        .for('update');

      if (!target) {
        return 'not-found';
      }

      if (!target.closedAt || now.getTime() - target.closedAt.getTime() > windowMs) {
        return 'expired';
      }

      try {
        await tx
          .update(lists)
          .set({ status: 'open', closedAt: null, closedBy: null })
          .where(eq(lists.id, listId));
      } catch (error) {
        // Otra petición pudo abrir una lista entre la comprobación y el update.
        if (isUniqueViolation(error)) {
          return 'already-open';
        }
        throw error;
      }

      return 'reopened';
    });
  }

  async findLastFinished(householdId: string): Promise<FinishedListSummary | null> {
    const [row] = await this.db
      .select({
        id: lists.id,
        closedAt: lists.closedAt,
        closedById: lists.closedBy,
        closedByName: users.displayName,
        itemCount: sql<number>`count(${items.id})::int`,
      })
      .from(lists)
      .leftJoin(users, eq(users.id, lists.closedBy))
      .leftJoin(items, eq(items.listId, lists.id))
      .where(
        and(
          eq(lists.householdId, householdId),
          eq(lists.status, 'done'),
          isNotNull(lists.closedAt),
        ),
      )
      .groupBy(lists.id, users.displayName)
      .orderBy(desc(lists.closedAt))
      .limit(1);

    if (!row || row.closedAt === null) {
      return null;
    }

    return {
      id: row.id,
      closedAt: row.closedAt,
      closedBy: memberRef(row.closedById, row.closedByName),
      itemCount: row.itemCount,
    };
  }

  async productUsage(householdId: string, limit: number): Promise<ProductUsageRow[]> {
    const rows = await this.db
      .select({
        name: sql<string>`min(${items.name})`,
        count: sql<number>`count(*)::int`,
      })
      .from(items)
      .innerJoin(lists, eq(lists.id, items.listId))
      .where(eq(lists.householdId, householdId))
      .groupBy(items.normalizedName)
      .orderBy(sql`count(*) desc`, asc(items.normalizedName))
      .limit(limit);

    return rows.map((row) => ({ name: row.name, count: row.count }));
  }
}
