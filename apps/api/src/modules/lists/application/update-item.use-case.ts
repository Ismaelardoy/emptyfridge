import type { UpdateItemInput } from '@emptyfridge/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type { Clock } from '../../../shared/domain/ports';
import { CLOCK } from '../../../shared/domain/ports';
import { AppError } from '../../../shared/errors/app-error';
import type { HouseholdActor } from '../../auth/domain/household';
import { normalizeItemName } from '../domain/normalize-item-name';
import { SHOPPING_LIST_REPOSITORY } from '../domain/ports';
import type { ShoppingListRepository, UpdateItemPatch } from '../domain/ports';
import type { ShoppingItem } from '../domain/shopping-list';

@Injectable()
export class UpdateItemUseCase {
  constructor(
    @Inject(SHOPPING_LIST_REPOSITORY) private readonly lists: ShoppingListRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(
    actor: HouseholdActor,
    itemId: string,
    input: UpdateItemInput,
  ): Promise<ShoppingItem> {
    const patch: UpdateItemPatch = { updatedAt: this.clock.now() };

    if (input.name !== undefined) {
      const name = input.name.trim();
      patch.name = name;
      patch.normalizedName = normalizeItemName(name);
    }
    if (input.quantity !== undefined) {
      patch.quantity = input.quantity;
    }
    if (input.unit !== undefined) {
      patch.unit = input.unit;
    }
    if (input.checked !== undefined) {
      patch.checked = input.checked;
    }

    const item = await this.lists.updateItem(actor.householdId, itemId, patch);
    if (!item) {
      throw AppError.notFound('ITEM_NOT_FOUND', 'Ese producto ya no está en la lista.');
    }
    return item;
  }
}
