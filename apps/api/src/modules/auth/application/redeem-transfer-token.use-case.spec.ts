import { describe, expect, it, vi } from 'vitest';
import { sha256 } from '../../../shared/crypto';
import {
  NOW,
  fakeSessionRepository,
  fakeTransferTokenRepository,
  fakeUserRepository,
  fixedClock,
  fixedTokens,
  makeUser,
  sequentialIds,
} from '../../../test/fakes';
import { IssueSessionUseCase } from './issue-session.use-case';
import { RedeemTransferTokenUseCase } from './redeem-transfer-token.use-case';

const CODE = 'ABCD2345EFGH';

function build(overrides: Parameters<typeof fakeUserRepository>[0] = {}) {
  const transferTokens = fakeTransferTokenRepository({
    consume: vi.fn(async () => ({
      id: 't-1',
      userId: 'u1',
      tokenHash: sha256(CODE),
      expiresAt: new Date(NOW.getTime() + 60_000),
      usedAt: NOW,
      createdAt: NOW,
    })),
  });
  const users = fakeUserRepository({
    findByIdWithMembership: vi.fn(async () => makeUser({ id: 'u1' })),
    ...overrides,
  });
  const sessions = fakeSessionRepository();
  const issueSession = new IssueSessionUseCase(
    sessions,
    fixedTokens,
    fixedClock,
    sequentialIds('s'),
  );
  const useCase = new RedeemTransferTokenUseCase(transferTokens, users, fixedClock, issueSession);
  return { useCase, transferTokens, sessions };
}

describe('RedeemTransferTokenUseCase', () => {
  it('consume el vale y emite sesión para la identidad original', async () => {
    const { useCase, transferTokens, sessions } = build();

    const result = await useCase.execute(null, { code: CODE });

    expect(transferTokens.consume).toHaveBeenCalledWith(sha256(CODE), NOW);
    expect(result.user.id).toBe('u1');
    expect(result.session.token).toBe('session-token');
    expect(sessions.create).toHaveBeenCalledOnce();
  });

  it('no cambia la identidad de un dispositivo que ya tiene hogar', async () => {
    const { useCase, transferTokens } = build();
    const actor = makeUser({ id: 'u2' });

    await expect(useCase.execute(actor, { code: CODE })).rejects.toMatchObject({
      code: 'ALREADY_IN_HOUSEHOLD',
      status: 409,
    });
    expect(transferTokens.consume).not.toHaveBeenCalled();
  });

  it('rechaza un vale caducado, usado o inexistente', async () => {
    const { useCase } = build();
    const transferTokens = fakeTransferTokenRepository({ consume: vi.fn(async () => null) });
    const users = fakeUserRepository();
    const sessions = fakeSessionRepository();
    const issueSession = new IssueSessionUseCase(
      sessions,
      fixedTokens,
      fixedClock,
      sequentialIds('s'),
    );
    const invalid = new RedeemTransferTokenUseCase(transferTokens, users, fixedClock, issueSession);

    await expect(invalid.execute(null, { code: CODE })).rejects.toMatchObject({
      code: 'TRANSFER_CODE_INVALID',
      status: 404,
    });
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('rechaza el vale si la identidad ya no existe', async () => {
    const { useCase } = build({ findByIdWithMembership: vi.fn(async () => null) });

    await expect(useCase.execute(null, { code: CODE })).rejects.toMatchObject({
      code: 'TRANSFER_CODE_INVALID',
    });
  });
});
