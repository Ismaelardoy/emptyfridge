import { Inject, Injectable } from '@nestjs/common';
import { SHOPPING_LIST_REPOSITORY } from '../domain/ports';
import type { ShoppingListRepository } from '../domain/ports';
import type { ListWithItems } from '../domain/shopping-list';

@Injectable()
export class GetCurrentListUseCase {
  constructor(@Inject(SHOPPING_LIST_REPOSITORY) private readonly lists: ShoppingListRepository) {}

  async execute(householdId: string): Promise<ListWithItems | null> {
    const list = await this.lists.findOpen(householdId);
    if (!list) {
      return null;
    }
    return { ...list, items: await this.lists.listItems(list.id) };
  }
}
