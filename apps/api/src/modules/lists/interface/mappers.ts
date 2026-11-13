import type { ItemDto, ListDto, RecentAdditionDto } from '@emptyfridge/contracts';
import type { ListWithItems, RecentAddition, ShoppingItem } from '../domain/shopping-list';

export function toItemDto(item: ShoppingItem): ItemDto {
  return {
    id: item.id,
    listId: item.listId,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    checked: item.checked,
    addedBy: item.addedBy ? { id: item.addedBy.id, displayName: item.addedBy.displayName } : null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function toRecentAdditionDto(entry: RecentAddition): RecentAdditionDto {
  return {
    id: entry.id,
    itemName: entry.itemName,
    addedBy: entry.addedBy
      ? { id: entry.addedBy.id, displayName: entry.addedBy.displayName }
      : null,
    createdAt: entry.createdAt.toISOString(),
  };
}

export function toListDto(list: ListWithItems): ListDto {
  return {
    id: list.id,
    status: list.status,
    createdAt: list.createdAt.toISOString(),
    closedAt: list.closedAt ? list.closedAt.toISOString() : null,
    closedBy: list.closedBy
      ? { id: list.closedBy.id, displayName: list.closedBy.displayName }
      : null,
    items: list.items.map(toItemDto),
  };
}
