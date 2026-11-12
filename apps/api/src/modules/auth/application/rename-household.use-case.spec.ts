import { describe, expect, it, vi } from 'vitest';
import {
  fakeHouseholdRepository,
  makeHousehold,
  makeMembership,
  makeUser,
} from '../../../test/fakes';
import { RenameHouseholdUseCase } from './rename-household.use-case';

describe('RenameHouseholdUseCase', () => {
  it('permite al owner renombrar el hogar', async () => {
    const rename = vi.fn(async () => makeHousehold({ name: 'Nueva casa' }));
    const useCase = new RenameHouseholdUseCase(fakeHouseholdRepository({ rename }));

    await useCase.execute(makeUser({ membership: makeMembership({ role: 'owner' }) }), {
      name: 'Nueva casa',
    });

    expect(rename).toHaveBeenCalledWith('h1', 'Nueva casa');
  });

  it('rechaza a un miembro normal', async () => {
    const rename = vi.fn();
    const useCase = new RenameHouseholdUseCase(fakeHouseholdRepository({ rename }));

    await expect(
      useCase.execute(makeUser({ membership: makeMembership({ role: 'member' }) }), {
        name: 'Nueva casa',
      }),
    ).rejects.toMatchObject({ code: 'OWNER_ONLY', status: 403 });
    expect(rename).not.toHaveBeenCalled();
  });
});
