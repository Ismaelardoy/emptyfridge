import type { MemberRef } from '../../../shared/domain/member-ref';

export const UNITS = ['ud', 'kg', 'g', 'L', 'ml', 'paquete'] as const;
export type Unit = (typeof UNITS)[number];

export const LIST_UNDO_WINDOW_MS = 30 * 60_000;

export type ListStatus = 'open' | 'done';

export interface ShoppingList {
  id: string;
  householdId: string;
  status: ListStatus;
  createdAt: Date;
  closedAt: Date | null;
  closedBy: MemberRef | null;
}

export interface ShoppingItem {
  id: string;
  listId: string;
  name: string;
  normalizedName: string;
  quantity: number | null;
  unit: Unit | null;
  checked: boolean;
  addedBy: MemberRef | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListWithItems extends ShoppingList {
  items: ShoppingItem[];
}

/** Alta reciente en cualquier lista del hogar (incluidas las ya cerradas). */
export interface RecentAddition {
  id: string;
  itemName: string;
  addedBy: MemberRef | null;
  createdAt: Date;
}

export interface FinishedListSummary {
  id: string;
  closedAt: Date;
  closedBy: MemberRef | null;
  itemCount: number;
}

export type ReopenResult = 'reopened' | 'already-open' | 'not-found' | 'expired';

export interface CurrentList {
  list: ListWithItems | null;
  recentAdditions: RecentAddition[];
  lastFinished: FinishedListSummary | null;
}

export interface FinishResult {
  closedListId: string;
}
