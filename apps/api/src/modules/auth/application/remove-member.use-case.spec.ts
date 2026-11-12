import { describe, expect, it, vi } from 'vitest';
import {
  fakeHouseholdRepository,
  fakeUserRepository,
  makeHousehold,
  makeMembership,
  makeUser,
} from '../../../test/fakes';
import { RemoveMemberUseCase } from './remove-member.use-case';

const owner = makeUser({ membership: makeMembership({ role: 'owner' }) });
const target = makeUser({
  id: 'u2',
  displayName: 'Luis',
  membership: makeMembership({ role: 'member' }),
});

function build(overrides: Parameters<typeof fakeUserRepository>[0] = {}) {
  const removeMember = vi.fn(async () => undefined);
  const users = fakeUserRepository({
    findByIdWithMembership: vi.fn(async () => target),
    ...overrides,
  });
  const households = fakeHouseholdRepository({ removeMember });

  return {
    removeMember,
    useCase: new RemoveMemberUseCase(users, households),
  };
}

describe('RemoveMemberUseCase', () => {
  it('expulsa a otro miembro del hogar', async () => {
    const { useCase, removeMember } = build();

    await useCase.execute(owner, 'u2');

    expect(removeMember).toHaveBeenCalledWith('h1', 'u2');
  });

  it('rechaza a un miembro que no es owner', async () => {
    const { useCase, removeMember } = build();

    await expect(
      useCase.execute(makeUser({ membership: makeMembership({ role: 'member' }) }), 'u2'),
    ).rejects.toMatchObject({ code: 'OWNER_ONLY', status: 403 });
    expect(removeMember).not.toHaveBeenCalled();
  });

  it('no permite expulsarse a uno mismo', async () => {
    const { useCase, removeMember } = build();

    await expect(useCase.execute(owner, owner.id)).rejects.toMatchObject({
      code: 'CANNOT_REMOVE_SELF',
      status: 409,
    });
    expect(removeMember).not.toHaveBeenCalled();
  });

  it('no encuentra miembros de otro hogar', async () => {
    const foreign = makeUser({
      id: 'u3',
      membership: makeMembership({
        household: makeHousehold({ id: 'h2' }),
        role: 'member',
      }),
    });
    const { useCase, removeMember } = build({
      findByIdWithMembership: vi.fn(async () => foreign),
    });

    await expect(useCase.execute(owner, 'u3')).rejects.toMatchObject({
      code: 'MEMBER_NOT_FOUND',
      status: 404,
    });
    expect(removeMember).not.toHaveBeenCalled();
  });
});
