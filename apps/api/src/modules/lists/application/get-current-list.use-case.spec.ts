import { describe, expect, it, vi } from 'vitest';
import { fakeShoppingListRepository, fixedClock } from '../../../test/fakes';
import type { ShoppingItem, ShoppingList } from '../domain/shopping-list';
import { GetCurrentListUseCase } from './get-current-list.use-case';

const NOW = fixedClock.now();

const openList: ShoppingList = {
  id: 'l1',
  householdId: 'h1',
  status: 'open',
  createdAt: NOW,
  closedAt: null,
  closedBy: null,
};

function makeItem(overrides: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id: 'i1',
    listId: 'l1',
    name: 'Leche',
    normalizedName: 'leche',
    quantity: null,
    unit: null,
    checked: false,
    addedBy: { id: 'u1', displayName: 'Ana' },
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('GetCurrentListUseCase (ETag)', () => {
  it('devuelve 304 lógico cuando la versión barata coincide', async () => {
    const listItems = vi.fn(async () => [makeItem()]);
    const repository = fakeShoppingListRepository({
      findOpen: vi.fn(async () => openList),
      itemsVersion: vi.fn(async () => '1:1000'),
      listItems,
    });

    const useCase = new GetCurrentListUseCase(repository, fixedClock);
    const result = await useCase.execute('h1', 'open:l1:1:1000');

    expect(result.current).toBeNull();
    expect(result.version).toBe('open:l1:1:1000');
    expect(listItems).not.toHaveBeenCalled();
  });

  it('devuelve la lista y una versión que coincide con el cuerpo enviado', async () => {
    const item = makeItem({ updatedAt: new Date(NOW.getTime() + 5000) });
    const repository = fakeShoppingListRepository({
      findOpen: vi.fn(async () => openList),
      itemsVersion: vi.fn(async () => '1:1000'),
      listItems: vi.fn(async () => [item]),
    });

    const useCase = new GetCurrentListUseCase(repository, fixedClock);
    const result = await useCase.execute('h1', 'open:l1:1:999');

    expect(result.current?.list?.items).toEqual([item]);
    expect(result.version).toBe(`open:l1:1:${item.updatedAt.getTime()}`);
  });

  it('busca la última compra solo dentro de la ventana de 30 minutos', async () => {
    const findLastFinished = vi.fn(async () => ({
      id: 'l0',
      closedAt: NOW,
      closedBy: null,
      itemCount: 3,
    }));
    const repository = fakeShoppingListRepository({
      findOpen: vi.fn(async () => null),
      findLastFinished,
    });

    const useCase = new GetCurrentListUseCase(repository, fixedClock);
    const result = await useCase.execute('h1');

    expect(findLastFinished).toHaveBeenCalledWith('h1', new Date(NOW.getTime() - 30 * 60_000));
    expect(result.version).toBe(`none:l0:${NOW.getTime()}`);
    expect(result.current?.lastFinished?.id).toBe('l0');
  });

  it('sin lista y sin compra reciente devuelve una versión estable', async () => {
    const repository = fakeShoppingListRepository({
      findOpen: vi.fn(async () => null),
      findLastFinished: vi.fn(async () => null),
    });

    const useCase = new GetCurrentListUseCase(repository, fixedClock);

    const first = await useCase.execute('h1');
    const second = await useCase.execute('h1', first.version);

    expect(first.version).toBe('none::0');
    expect(second.current).toBeNull();
  });
});
