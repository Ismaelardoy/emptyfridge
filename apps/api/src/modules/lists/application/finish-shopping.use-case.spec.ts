import { describe, expect, it, vi } from 'vitest';
import { fakeShoppingListRepository, fixedClock, makeHouseholdActor } from '../../../test/fakes';
import { FinishShoppingUseCase } from './finish-shopping.use-case';

describe('FinishShoppingUseCase', () => {
  it('cierra la compra', async () => {
    const finish = vi.fn(async () => ({ closedListId: 'l1' }));
    const repository = fakeShoppingListRepository({ finish });

    const useCase = new FinishShoppingUseCase(repository, fixedClock);
    const result = await useCase.execute(makeHouseholdActor());

    expect(result).toEqual({ closedListId: 'l1' });
    expect(finish).toHaveBeenCalledWith('h1', 'u1', fixedClock.now());
  });

  it('falla si no hay compra en curso', async () => {
    const repository = fakeShoppingListRepository({ finish: vi.fn(async () => null) });
    const useCase = new FinishShoppingUseCase(repository, fixedClock);

    await expect(useCase.execute(makeHouseholdActor())).rejects.toMatchObject({
      code: 'NO_OPEN_LIST',
    });
  });
});
