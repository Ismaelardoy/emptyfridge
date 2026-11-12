import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../shared/errors/app-error';
import { SHOPPING_LIST_REPOSITORY } from '../domain/ports';
import type { ShoppingListRepository } from '../domain/ports';

@Injectable()
export class DeleteItemUseCase {
  constructor(@Inject(SHOPPING_LIST_REPOSITORY) private readonly lists: ShoppingListRepository) {}

  async execute(householdId: string, itemId: string): Promise<void> {
    const deleted = await this.lists.deleteItem(householdId, itemId);
    if (!deleted) {
      throw AppError.notFound('ITEM_NOT_FOUND', 'Ese producto ya no está en la lista.');
    }
  }
}
