import { Inject, Injectable } from '@nestjs/common';
import type { Clock } from '../../../shared/domain/ports';
import { CLOCK } from '../../../shared/domain/ports';
import { AppError } from '../../../shared/errors/app-error';
import { SHOPPING_LIST_REPOSITORY } from '../domain/ports';
import type { ShoppingListRepository } from '../domain/ports';
import { LIST_UNDO_WINDOW_MS } from '../domain/shopping-list';

@Injectable()
export class ReopenListUseCase {
  constructor(
    @Inject(SHOPPING_LIST_REPOSITORY) private readonly lists: ShoppingListRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(householdId: string, listId: string): Promise<void> {
    const result = await this.lists.reopen(
      householdId,
      listId,
      this.clock.now(),
      LIST_UNDO_WINDOW_MS,
    );

    if (result === 'already-open') {
      throw AppError.conflict(
        'LIST_ALREADY_OPEN',
        'Ya hay otra lista abierta. Añade o mira esa lista.',
      );
    }

    if (result === 'expired') {
      throw AppError.conflict('UNDO_EXPIRED', 'Ya pasó el tiempo para revertir esta compra.');
    }

    if (result === 'not-found') {
      throw AppError.notFound('LIST_NOT_FOUND', 'Esa compra ya no existe.');
    }
  }
}
