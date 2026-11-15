import { Inject, Injectable } from '@nestjs/common';
import type { Clock } from '../../../shared/domain/ports';
import { CLOCK } from '../../../shared/domain/ports';
import { groupProductNames } from '../domain/group-product-names';
import type { ProductUsage } from '../domain/group-product-names';
import { SHOPPING_LIST_REPOSITORY } from '../domain/ports';
import type { ShoppingListRepository } from '../domain/ports';

/** Tope de nombres distintos antes de agrupar: el clustering es O(n²). */
const MAX_SOURCE_ROWS = 250;

/** Solo miramos el último año: acota el coste aunque el histórico crezca. */
const USAGE_WINDOW_MS = 365 * 24 * 60 * 60 * 1000;

@Injectable()
export class MostUsedUseCase {
  constructor(
    @Inject(SHOPPING_LIST_REPOSITORY) private readonly lists: ShoppingListRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(householdId: string, limit = 30): Promise<ProductUsage[]> {
    const since = new Date(this.clock.now().getTime() - USAGE_WINDOW_MS);
    const rows = await this.lists.productUsage(householdId, MAX_SOURCE_ROWS, since);
    return groupProductNames(rows).slice(0, limit);
  }
}
