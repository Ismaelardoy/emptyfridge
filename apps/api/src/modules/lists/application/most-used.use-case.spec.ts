import { describe, expect, it, vi } from 'vitest';
import { fakeShoppingListRepository, fixedClock } from '../../../test/fakes';
import { MostUsedUseCase } from './most-used.use-case';

describe('MostUsedUseCase', () => {
  it('acota la consulta al último año y a un máximo de nombres', async () => {
    const productUsage = vi.fn(async () => [{ name: 'Leche', count: 3 }]);
    const repository = fakeShoppingListRepository({ productUsage });

    const useCase = new MostUsedUseCase(repository, fixedClock);
    await useCase.execute('h1', 10);

    const [householdId, limit, since] = productUsage.mock.calls[0] as unknown as [
      string,
      number,
      Date,
    ];

    expect(householdId).toBe('h1');
    expect(limit).toBe(250);
    expect(since.getTime()).toBe(fixedClock.now().getTime() - 365 * 24 * 60 * 60 * 1000);
  });
});
