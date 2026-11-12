import { describe, expect, it, vi } from 'vitest';
import { sha256 } from '../../../shared/crypto';
import {
  fakeSessionRepository,
  fakeUserRepository,
  fixedClock,
  fixedTokens,
  makeUser,
  sequentialIds,
} from '../../../test/fakes';
import { IssueSessionUseCase } from './issue-session.use-case';
import { RecoverIdentityUseCase } from './recover-identity.use-case';

const CODE = 'ABCD2345EFGHJKLM';

function build(overrides: Parameters<typeof fakeUserRepository>[0] = {}) {
  const users = fakeUserRepository({
    findByRecoveryCodeHash: vi.fn(async () => makeUser({ id: 'u1' })),
    ...overrides,
  });
  const sessions = fakeSessionRepository();
  const issueSession = new IssueSessionUseCase(
    sessions,
    fixedTokens,
    fixedClock,
    sequentialIds('s'),
  );
  const useCase = new RecoverIdentityUseCase(users, issueSession);
  return { useCase, users, sessions };
}

describe('RecoverIdentityUseCase', () => {
  it('encuentra la identidad por hash y emite una sesión nueva', async () => {
    const { useCase, users, sessions } = build();

    const result = await useCase.execute(null, { code: CODE });

    expect(users.findByRecoveryCodeHash).toHaveBeenCalledWith(sha256(CODE));
    expect(result.user.id).toBe('u1');
    expect(result.session.token).toBe('session-token');
    expect(sessions.create).toHaveBeenCalledOnce();
  });

  it('no cambia la identidad de un dispositivo que ya tiene hogar', async () => {
    const { useCase, users } = build();

    await expect(useCase.execute(makeUser({ id: 'u2' }), { code: CODE })).rejects.toMatchObject({
      code: 'ALREADY_IN_HOUSEHOLD',
      status: 409,
    });
    expect(users.findByRecoveryCodeHash).not.toHaveBeenCalled();
  });

  it('rechaza un código que no existe', async () => {
    const { useCase, sessions } = build({ findByRecoveryCodeHash: vi.fn(async () => null) });

    await expect(useCase.execute(null, { code: CODE })).rejects.toMatchObject({
      code: 'RECOVERY_CODE_INVALID',
      status: 404,
    });
    expect(sessions.create).not.toHaveBeenCalled();
  });
});
