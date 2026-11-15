import { Inject, Injectable } from '@nestjs/common';
import type { Clock } from '../../../shared/domain/ports';
import { CLOCK } from '../../../shared/domain/ports';
import { SHOPPING_LIST_REPOSITORY } from '../domain/ports';
import type { ShoppingListRepository } from '../domain/ports';
import {
  type CurrentList,
  LIST_UNDO_WINDOW_MS,
  type RecentAddition,
  type ShoppingItem,
} from '../domain/shopping-list';

export interface CurrentListResult {
  /** Huella del estado; se usa como ETag para que el sondeo reciba 304. */
  version: string;
  /** `null` cuando el cliente ya tiene exactamente esta versión. */
  current: CurrentList | null;
}

@Injectable()
export class GetCurrentListUseCase {
  constructor(
    @Inject(SHOPPING_LIST_REPOSITORY) private readonly lists: ShoppingListRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(householdId: string, knownVersion?: string): Promise<CurrentListResult> {
    const list = await this.lists.findOpen(householdId);

    if (list) {
      // Primero una huella barata (count + max updated_at). Si coincide, no
      // hace falta traer los productos ni serializarlos.
      const cheapVersion = `open:${list.id}:${await this.lists.itemsVersion(list.id)}`;
      if (knownVersion === cheapVersion) {
        return { version: cheapVersion, current: null };
      }

      const items = await this.lists.listItems(list.id);
      // Se recalcula con lo que de verdad se va a devolver: si alguien tocó la
      // lista entre las dos consultas, el ETag refleja el cuerpo enviado.
      return {
        version: `open:${list.id}:${items.length}:${maxUpdatedAt(items)}`,
        current: {
          list: { ...list, items },
          // Solo productos que siguen en la lista actual: ni compras cerradas
          // ni altas que ya se hayan eliminado.
          recentAdditions: recentAdditionsFrom(items),
          lastFinished: null,
        },
      };
    }

    const now = this.clock.now();
    const lastFinished = await this.lists.findLastFinished(
      householdId,
      new Date(now.getTime() - LIST_UNDO_WINDOW_MS),
    );
    const version = `none:${lastFinished?.id ?? ''}:${lastFinished?.closedAt.getTime() ?? 0}`;

    if (knownVersion === version) {
      return { version, current: null };
    }

    return {
      version,
      current: {
        list: null,
        recentAdditions: [],
        lastFinished,
      },
    };
  }
}

function maxUpdatedAt(items: ShoppingItem[]): number {
  let max = 0;
  for (const item of items) {
    max = Math.max(max, item.updatedAt.getTime());
  }
  return max;
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
