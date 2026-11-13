import { Inject, Injectable } from '@nestjs/common';
import { SHOPPING_LIST_REPOSITORY } from '../domain/ports';
import type { ShoppingListRepository } from '../domain/ports';
import type { CurrentList, RecentAddition, ShoppingItem } from '../domain/shopping-list';

@Injectable()
export class GetCurrentListUseCase {
  constructor(@Inject(SHOPPING_LIST_REPOSITORY) private readonly lists: ShoppingListRepository) {}

  async execute(householdId: string): Promise<CurrentList> {
    const list = await this.lists.findOpen(householdId);
    if (!list) {
      return { list: null, recentAdditions: [] };
    }

    const items = await this.lists.listItems(list.id);

    return {
      list: { ...list, items },
      // Solo productos que siguen en la lista actual: ni compras cerradas ni
      // altas que ya se hayan eliminado.
      recentAdditions: recentAdditionsFrom(items),
    };
  }
}

function recentAdditionsFrom(items: ShoppingItem[]): RecentAddition[] {
  return items
    .filter((item) => item.addedBy !== null)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 15)
    .map((item) => ({
      id: item.id,
      itemName: item.name,
      addedBy: item.addedBy,
      createdAt: item.createdAt,
    }));
}
