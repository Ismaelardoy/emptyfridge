import { describe, expect, it, vi } from 'vitest';
import {
  NOW,
  fakeHouseholdRepository,
  fakeSessionRepository,
  fakeUserRepository,
  fixedClock,
  fixedTokens,
  makeHousehold,
  makeUser,
  sequentialIds,
} from '../../../test/fakes';
import { CreateAnonymousUserUseCase } from './create-anonymous-user.use-case';
import { IssueSessionUseCase } from './issue-session.use-case';
import { JoinHouseholdUseCase } from './join-household.use-case';
import { QuickJoinHouseholdUseCase } from './quick-join-household.use-case';

function build({ inviteCodeFound = true } = {}) {
  const household = makeHousehold({ id: 'h1', inviteCode: 'ABCD2345' });
  const anon = makeUser({ id: 'u9', membership: null });
  const joined = makeUser({
    id: 'u9',
    membership: { household, role: 'member', joinedAt: NOW },
  });
  const deleteById = vi.fn(async () => undefined);
  const users = fakeUserRepository({
    create: vi.fn(async (input) => ({ ...anon, ...input, membership: null })),
    findByIdWithMembership: vi.fn(async () => joined),
    deleteById,
  });
  const households = fakeHouseholdRepository({
    findByInviteCode: vi.fn(async () => (inviteCodeFound ? household : null)),
    addMember: vi.fn(async () => ({ household, role: 'member' as const, joinedAt: NOW })),
  });
  const sessions = fakeSessionRepository();
  const issueSession = new IssueSessionUseCase(
    sessions,
    fixedTokens,
    fixedClock,
    sequentialIds('s'),
  );
  const createAnonymousUser = new CreateAnonymousUserUseCase(users, fixedClock, sequentialIds('u'));
  const joinHousehold = new JoinHouseholdUseCase(users, households, fixedClock);
  const quick = new QuickJoinHouseholdUseCase(
    createAnonymousUser,
    joinHousehold,
    issueSession,
    households,
    users,
  );

  return { household, quick, sessions, deleteById };
}

describe('QuickJoinHouseholdUseCase', () => {
  it('crea identidad anónima, membresía y sesión al abrir un enlace', async () => {
    const { quick, sessions } = build();

    const result = await quick.execute(null, { inviteCode: 'ABCD2345' });

    expect(result.user.membership?.household.id).toBe('h1');
    expect(result.session?.token).toBe('session-token');
    expect(sessions.create).toHaveBeenCalledOnce();
  });

  it('es idempotente si ya está en ese mismo hogar', async () => {
    const { household, quick } = build();
    const actor = makeUser({
      membership: { household, role: 'member', joinedAt: NOW },
    });

    const result = await quick.execute(actor, { inviteCode: 'ABCD2345' });

    expect(result.user).toBe(actor);
    expect(result.session).toBeUndefined();
  });

  it('elimina la identidad recién creada si no puede entrar en ningún hogar', async () => {
    const { quick, deleteById } = build({ inviteCodeFound: false });

    await expect(quick.execute(null, { inviteCode: 'ABCD2345' })).rejects.toMatchObject({
      code: 'INVITE_CODE_NOT_FOUND',
      status: 404,
    });
    expect(deleteById).toHaveBeenCalledOnce();
  });
});
