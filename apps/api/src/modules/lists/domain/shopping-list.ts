import type { MemberRef } from '../../../shared/domain/member-ref';

export const UNITS = ['ud', 'kg', 'g', 'L', 'ml', 'paquete'] as const;
export type Unit = (typeof UNITS)[number];

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

export interface FinishResult {
  closedListId: string;
}
