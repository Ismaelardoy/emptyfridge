import { describe, expect, it, vi } from 'vitest';
import {
  fakeHouseholdRepository,
  fakeUserRepository,
  makeHousehold,
  makeMembership,
  makeUser,
} from '../../../test/fakes';
import { TransferOwnershipUseCase } from './transfer-ownership.use-case';

const owner = makeUser({ membership: makeMembership({ role: 'owner' }) });
const target = makeUser({
  id: 'u2',
  displayName: 'Luis',
  membership: makeMembership({ role: 'member' }),
});

function build(overrides: Parameters<typeof fakeUserRepository>[0] = {}) {
  const transferOwnership = vi.fn(async () => undefined);
  const users = fakeUserRepository({
    findByIdWithMembership: vi.fn(async () => target),
    ...overrides,
  });
  const households = fakeHouseholdRepository({ transferOwnership });

  return {
    transferOwnership,
    useCase: new TransferOwnershipUseCase(users, households),
  };
}

describe('TransferOwnershipUseCase', () => {
  it('cede la propiedad a otro miembro del mismo hogar', async () => {
    const { useCase, transferOwnership } = build();

    await useCase.execute(owner, 'u2');

    expect(transferOwnership).toHaveBeenCalledWith('h1', 'u1', 'u2');
  });

  it('rechaza a quien no es owner', async () => {
    const { useCase, transferOwnership } = build();

    await expect(
      useCase.execute(makeUser({ membership: makeMembership({ role: 'member' }) }), 'u2'),
    ).rejects.toMatchObject({ code: 'OWNER_ONLY', status: 403 });
    expect(transferOwnership).not.toHaveBeenCalled();
  });

  it('no permite cederse la propiedad a uno mismo', async () => {
    const { useCase, transferOwnership } = build();

    await expect(useCase.execute(owner, owner.id)).rejects.toMatchObject({
      code: 'ALREADY_OWNER',
      status: 409,
    });
    expect(transferOwnership).not.toHaveBeenCalled();
  });

  it('rechaza a alguien de otro hogar', async () => {
    const foreign = makeUser({
      id: 'u3',
      membership: makeMembership({
        household: makeHousehold({ id: 'h2' }),
        role: 'member',
      }),
    });
    const { useCase, transferOwnership } = build({
      findByIdWithMembership: vi.fn(async () => foreign),
    });

    await expect(useCase.execute(owner, 'u3')).rejects.toMatchObject({
      code: 'MEMBER_NOT_FOUND',
      status: 404,
    });
    expect(transferOwnership).not.toHaveBeenCalled();
  });
});
