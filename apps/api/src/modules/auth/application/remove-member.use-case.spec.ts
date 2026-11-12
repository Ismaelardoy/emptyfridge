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
const member = makeUser({ membership: makeMembership({ role: 'member' }) });
const target = makeUser({
  id: 'u2',
  displayName: 'Luis',
  membership: makeMembership({ role: 'member' }),
});

function build(overrides: Parameters<typeof fakeUserRepository>[0] = {}) {
  const removeMember = vi.fn(async () => undefined);
  const deleteById = vi.fn(async () => undefined);
  const users = fakeUserRepository({
    findByIdWithMembership: vi.fn(async () => target),
    deleteById,
    ...overrides,
  });
  const households = fakeHouseholdRepository({ removeMember });

  return {
    removeMember,
    deleteById,
    useCase: new RemoveMemberUseCase(users, households),
  };
}

describe('RemoveMemberUseCase', () => {
  it('expulsa a otro miembro del hogar', async () => {
    const { useCase, removeMember, deleteById } = build();

    await useCase.execute(owner, 'u2');

    expect(removeMember).toHaveBeenCalledWith('h1', 'u2');
    expect(deleteById).toHaveBeenCalledWith('u2');
  });

  it('cualquier miembro puede expulsar a otro', async () => {
    const { useCase, removeMember, deleteById } = build();

    await useCase.execute(member, 'u2');

    expect(removeMember).toHaveBeenCalledWith('h1', 'u2');
    expect(deleteById).toHaveBeenCalledWith('u2');
  });

  it('si expulsa al propietario, el siguiente miembro pasa a owner', async () => {
    const ownerTarget = makeUser({
      id: 'u2',
      displayName: 'Luis',
      membership: makeMembership({ role: 'owner' }),
    });
    const remaining = {
      id: 'u3',
      displayName: 'Marta',
      role: 'member' as const,
      joinedAt: new Date(),
    };
    const removeMember = vi.fn(async () => undefined);
    const transferOwnership = vi.fn(async () => undefined);
    const deleteById = vi.fn(async () => undefined);
    const users = fakeUserRepository({
      findByIdWithMembership: vi.fn(async () => ownerTarget),
      deleteById,
    });
    const households = fakeHouseholdRepository({
      removeMember,
      transferOwnership,
      listMembers: vi.fn(async () => [remaining]),
    });

    await new RemoveMemberUseCase(users, households).execute(member, 'u2');

    expect(removeMember).toHaveBeenCalledWith('h1', 'u2');
    expect(transferOwnership).toHaveBeenCalledWith('h1', 'u1', 'u3');
    expect(deleteById).toHaveBeenCalledWith('u2');
  });

  it('no permite expulsarse a uno mismo', async () => {
    const { useCase, removeMember, deleteById } = build();

    await expect(useCase.execute(owner, owner.id)).rejects.toMatchObject({
      code: 'CANNOT_REMOVE_SELF',
      status: 409,
    });
    expect(removeMember).not.toHaveBeenCalled();
    expect(deleteById).not.toHaveBeenCalled();
  });

  it('no encuentra miembros de otro hogar', async () => {
    const foreign = makeUser({
      id: 'u3',
      membership: makeMembership({
        household: makeHousehold({ id: 'h2' }),
        role: 'member',
      }),
    });
    const { useCase, removeMember, deleteById } = build({
      findByIdWithMembership: vi.fn(async () => foreign),
    });

    await expect(useCase.execute(owner, 'u3')).rejects.toMatchObject({
      code: 'MEMBER_NOT_FOUND',
      status: 404,
    });
    expect(removeMember).not.toHaveBeenCalled();
    expect(deleteById).not.toHaveBeenCalled();
  });
});
