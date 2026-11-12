import type { AddItemInput } from '@emptyfridge/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type { Clock } from '../../../shared/domain/ports';
import { CLOCK } from '../../../shared/domain/ports';
import type { HouseholdActor } from '../../auth/domain/household';
import { normalizeItemName } from '../domain/normalize-item-name';
import { SHOPPING_LIST_REPOSITORY } from '../domain/ports';
import type { ShoppingListRepository } from '../domain/ports';
import type { ShoppingItem } from '../domain/shopping-list';

export interface AddItemResult {
  item: ShoppingItem;
  created: boolean;
}

@Injectable()
export class AddItemUseCase {
  constructor(
    @Inject(SHOPPING_LIST_REPOSITORY) private readonly lists: ShoppingListRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(actor: HouseholdActor, input: AddItemInput): Promise<AddItemResult> {
    const now = this.clock.now();
    const list = await this.lists.ensureOpen(actor.householdId, now);

    const name = input.name.trim();
    const normalizedName = normalizeItemName(name);
    const existing = await this.lists.findOpenItemByNormalizedName(list.id, normalizedName);
    if (existing) {
      return { item: existing, created: false };
    }

    const unit = input.unit ?? null;
    const quantity = input.quantity ?? (unit ? 1 : null);

    return this.lists.addItem({
      listId: list.id,
      name,
      normalizedName,
      quantity,
      unit,
      addedBy: { id: actor.id, displayName: actor.displayName },
      createdAt: now,
    });
  }
}
