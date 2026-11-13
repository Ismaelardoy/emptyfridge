import type { MemberRef } from '../../../shared/domain/member-ref';
import type {
  FinishResult,
  FinishedListSummary,
  ReopenResult,
  ShoppingItem,
  ShoppingList,
  Unit,
} from './shopping-list';

export const SHOPPING_LIST_REPOSITORY = Symbol('SHOPPING_LIST_REPOSITORY');

export interface NewItemRecord {
  listId: string;
  name: string;
  normalizedName: string;
  quantity: number | null;
  unit: Unit | null;
  addedBy: MemberRef;
  createdAt: Date;
}

export interface UpdateItemPatch {
  name?: string;
  normalizedName?: string;
  quantity?: number | null;
  unit?: Unit | null;
  checked?: boolean;
  updatedAt: Date;
}

export interface ProductUsageRow {
  name: string;
  count: number;
}

export interface ShoppingListRepository {
  findOpen(householdId: string): Promise<ShoppingList | null>;
  ensureOpen(householdId: string, now: Date): Promise<ShoppingList>;
  listItems(listId: string): Promise<ShoppingItem[]>;
  findOpenItemByNormalizedName(
    listId: string,
    normalizedName: string,
  ): Promise<ShoppingItem | null>;
  addItem(record: NewItemRecord): Promise<{ item: ShoppingItem; created: boolean }>;
  updateItem(
    householdId: string,
    itemId: string,
    patch: UpdateItemPatch,
  ): Promise<ShoppingItem | null>;
  deleteItem(householdId: string, itemId: string): Promise<boolean>;
  finish(householdId: string, actorId: string, now: Date): Promise<FinishResult | null>;
  reopen(householdId: string, listId: string, now: Date, windowMs: number): Promise<ReopenResult>;
  findLastFinished(householdId: string): Promise<FinishedListSummary | null>;
  productUsage(householdId: string, limit: number): Promise<ProductUsageRow[]>;
}
