import { Inject, Injectable } from '@nestjs/common';
import type { Clock } from '../../../shared/domain/ports';
import { CLOCK } from '../../../shared/domain/ports';
import { AppError } from '../../../shared/errors/app-error';
import type { HouseholdActor } from '../../auth/domain/household';
import { SHOPPING_LIST_REPOSITORY } from '../domain/ports';
import type { ShoppingListRepository } from '../domain/ports';
import type { FinishResult } from '../domain/shopping-list';

@Injectable()
export class FinishShoppingUseCase {
  constructor(
    @Inject(SHOPPING_LIST_REPOSITORY) private readonly lists: ShoppingListRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(actor: HouseholdActor): Promise<FinishResult> {
    const result = await this.lists.finish(actor.householdId, actor.id, this.clock.now());

    if (!result) {
      throw AppError.notFound('NO_OPEN_LIST', 'No hay ninguna compra en curso.');
    }

    return result;
  }
}
