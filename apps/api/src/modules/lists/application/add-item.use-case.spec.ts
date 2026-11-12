import { describe, expect, it, vi } from 'vitest';
import { fakeShoppingListRepository, fixedClock, makeHouseholdActor } from '../../../test/fakes';
import type { NewItemRecord } from '../domain/ports';
import type { ShoppingItem, ShoppingList } from '../domain/shopping-list';
import { AddItemUseCase } from './add-item.use-case';

const NOW = fixedClock.now();

const openList: ShoppingList = {
  id: 'l1',
  householdId: 'h1',
  status: 'open',
  createdAt: NOW,
  closedAt: null,
  closedBy: null,
};

function itemFrom(record: NewItemRecord, id = 'i1'): ShoppingItem {
  return {
    id,
    checked: false,
    updatedAt: record.createdAt,
    ...record,
  };
}

describe('AddItemUseCase', () => {
  it('crea la lista si no existe y normaliza el nombre', async () => {
    const addItem = vi.fn(async (record: NewItemRecord) => ({
      item: itemFrom(record),
      created: true,
    }));
    const repository = fakeShoppingListRepository({
      ensureOpen: vi.fn(async () => openList),
      findOpenItemByNormalizedName: vi.fn(async () => null),
      addItem,
    });

    const useCase = new AddItemUseCase(repository, fixedClock);
    const result = await useCase.execute(makeHouseholdActor(), { name: '  Leche  ' });

    expect(result.created).toBe(true);
    expect(addItem).toHaveBeenCalledWith(
      expect.objectContaining({
        listId: 'l1',
        name: 'Leche',
        normalizedName: 'leche',
        quantity: null,
        unit: null,
        addedBy: { id: 'u1', displayName: 'Ana' },
      }),
    );
  });

  it('no duplica un producto que ya está pendiente', async () => {
    const existing = itemFrom({
      listId: 'l1',
      name: 'Leche',
      normalizedName: 'leche',
      quantity: null,
      unit: null,
      addedBy: { id: 'u1', displayName: 'Ana' },
      createdAt: NOW,
    });
    const addItem = vi.fn();
    const repository = fakeShoppingListRepository({
      ensureOpen: vi.fn(async () => openList),
      findOpenItemByNormalizedName: vi.fn(async () => existing),
      addItem,
    });

    const useCase = new AddItemUseCase(repository, fixedClock);
    const result = await useCase.execute(makeHouseholdActor(), { name: 'leche' });

    expect(result).toEqual({ item: existing, created: false });
    expect(addItem).not.toHaveBeenCalled();
  });

  it('si se indica unidad sin cantidad, asume 1', async () => {
    const addItem = vi.fn(async (record: NewItemRecord) => ({
      item: itemFrom(record),
      created: true,
    }));
    const repository = fakeShoppingListRepository({
      ensureOpen: vi.fn(async () => openList),
      findOpenItemByNormalizedName: vi.fn(async () => null),
      addItem,
    });

    const useCase = new AddItemUseCase(repository, fixedClock);
    await useCase.execute(makeHouseholdActor(), { name: 'Patatas', unit: 'kg' });

    expect(addItem).toHaveBeenCalledWith(expect.objectContaining({ quantity: 1, unit: 'kg' }));
  });
});
