import { describe, expect, it, vi } from 'vitest';
import { sha256 } from '../../../shared/crypto';
import { AppError } from '../../../shared/errors/app-error';
import { fakeUserRepository, fixedTokens, makeUser } from '../../../test/fakes';
import { GenerateRecoveryCodeUseCase } from './generate-recovery-code.use-case';

describe('GenerateRecoveryCodeUseCase', () => {
  it('genera un código y guarda solo su hash', async () => {
    const users = fakeUserRepository();
    const useCase = new GenerateRecoveryCodeUseCase(users, fixedTokens);

    const result = await useCase.execute(makeUser({ id: 'u1' }));

    expect(result.code).toBe('ABCD2345EFGHJKLM');
    expect(users.updateRecoveryCodeHash).toHaveBeenCalledWith('u1', sha256(result.code));
  });

  it('reintenta si el código ya está pillado', async () => {
    const users = fakeUserRepository({
      updateRecoveryCodeHash: vi
        .fn()
        .mockRejectedValueOnce(AppError.conflict('RECOVERY_CODE_COLLISION', 'repetido'))
        .mockResolvedValueOnce(undefined),
    });
    const useCase = new GenerateRecoveryCodeUseCase(users, fixedTokens);

    await useCase.execute(makeUser({ id: 'u1' }));

    expect(users.updateRecoveryCodeHash).toHaveBeenCalledTimes(2);
  });
});
