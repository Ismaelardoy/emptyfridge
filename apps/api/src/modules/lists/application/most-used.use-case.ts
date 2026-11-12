import { Inject, Injectable } from '@nestjs/common';
import { groupProductNames } from '../domain/group-product-names';
import type { ProductUsage } from '../domain/group-product-names';
import { SHOPPING_LIST_REPOSITORY } from '../domain/ports';
import type { ShoppingListRepository } from '../domain/ports';

const MAX_SOURCE_ROWS = 500;

@Injectable()
export class MostUsedUseCase {
  constructor(@Inject(SHOPPING_LIST_REPOSITORY) private readonly lists: ShoppingListRepository) {}

  async execute(householdId: string, limit = 30): Promise<ProductUsage[]> {
    const rows = await this.lists.productUsage(householdId, MAX_SOURCE_ROWS);
    return groupProductNames(rows).slice(0, limit);
  }
}
