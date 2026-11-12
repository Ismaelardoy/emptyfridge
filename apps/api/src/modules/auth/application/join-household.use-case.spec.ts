import { describe, expect, it, vi } from 'vitest';
import {
  NOW,
  fakeHouseholdRepository,
  fakeUserRepository,
  makeHousehold,
  makeUser,
} from '../../../test/fakes';
import { JoinHouseholdUseCase } from './join-household.use-case';

const household = makeHousehold({ id: 'h1', inviteCode: 'ABCD2345' });
const actor = makeUser({ id: 'u2', membership: null });

function build(members: number) {
  const addMember = vi.fn(async () => ({ household, role: 'owner' as const, joinedAt: NOW }));
  const households = fakeHouseholdRepository({
    findByInviteCode: vi.fn(async () => household),
    listMembers: vi.fn(async () =>
      Array.from({ length: members }, (_, index) => ({
        id: index === 0 ? 'u1' : `u${index + 1}`,
        displayName: `Persona ${index + 1}`,
        role: 'owner' as const,
        joinedAt: NOW,
      })),
    ),
    addMember,
  });
  const users = fakeUserRepository({
    findByIdWithMembership: vi.fn(async () => makeUser({ id: 'u2' })),
  });

  return { addMember, useCase: new JoinHouseholdUseCase(users, households, { now: () => NOW }) };
}

describe('JoinHouseholdUseCase', () => {
  it('el primero que entra es propietario', async () => {
    const { useCase, addMember } = build(1);

    await useCase.execute(actor, { inviteCode: 'ABCD2345' });

    expect(addMember).toHaveBeenCalledWith(household, 'u2', 'owner', NOW);
  });

  it('los siguientes entran como miembros', async () => {
    const { useCase, addMember } = build(2);

    await useCase.execute(actor, { inviteCode: 'ABCD2345' });

    expect(addMember).toHaveBeenCalledWith(household, 'u2', 'member', NOW);
  });
});
