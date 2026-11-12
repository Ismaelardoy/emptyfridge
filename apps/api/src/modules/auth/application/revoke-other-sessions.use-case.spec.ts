import { describe, expect, it, vi } from 'vitest';
import { sha256 } from '../../../shared/crypto';
import { fakeSessionRepository, makeUser } from '../../../test/fakes';
import { RevokeOtherSessionsUseCase } from './revoke-other-sessions.use-case';

describe('RevokeOtherSessionsUseCase', () => {
  it('borra las demás sesiones y conserva la actual', async () => {
    const sessions = fakeSessionRepository({ deleteOthers: vi.fn(async () => 2) });
    const useCase = new RevokeOtherSessionsUseCase(sessions);

    const revoked = await useCase.execute(makeUser({ id: 'u1' }), 'current-token');

    expect(revoked).toBe(2);
    expect(sessions.deleteOthers).toHaveBeenCalledWith('u1', sha256('current-token'));
  });

  it('exige token actual', async () => {
    const sessions = fakeSessionRepository();
    const useCase = new RevokeOtherSessionsUseCase(sessions);

    await expect(useCase.execute(makeUser({ id: 'u1' }), undefined)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
    });
    expect(sessions.deleteOthers).not.toHaveBeenCalled();
  });
});
