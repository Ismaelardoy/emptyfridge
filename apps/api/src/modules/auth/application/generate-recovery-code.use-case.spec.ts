import { describe, expect, it, vi } from 'vitest';
import { sha256 } from '../../../shared/crypto';
import { AppError } from '../../../shared/errors/app-error';
import { fakeUserRepository, fixedTokens, makeUser } from '../../../test/fakes';
import { GenerateRecoveryCodeUseCase } from './generate-recovery-code.use-case';

describe('GenerateRecoveryCodeUseCase', () => {
  it('genera un código y guarda el código y su hash', async () => {
    const users = fakeUserRepository();
    const useCase = new GenerateRecoveryCodeUseCase(users, fixedTokens);

    const result = await useCase.execute(makeUser({ id: 'u1' }));

    expect(result.code).toBe('ABCD2345EFGHJKLM');
    expect(users.updateRecoveryCode).toHaveBeenCalledWith('u1', result.code, sha256(result.code));
  });

  it('reintenta si el código ya está pillado', async () => {
    const users = fakeUserRepository({
      updateRecoveryCode: vi
        .fn()
        .mockRejectedValueOnce(AppError.conflict('RECOVERY_CODE_COLLISION', 'repetido'))
        .mockResolvedValueOnce(undefined),
    });
    const useCase = new GenerateRecoveryCodeUseCase(users, fixedTokens);

    await useCase.execute(makeUser({ id: 'u1' }));

    expect(users.updateRecoveryCode).toHaveBeenCalledTimes(2);
  });
});
