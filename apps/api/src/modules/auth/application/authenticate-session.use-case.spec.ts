import { describe, expect, it, vi } from 'vitest';
import { sha256 } from '../../../shared/crypto';
import { fakeUserRepository, fixedClock, makeSession, makeUser } from '../../../test/fakes';
import { AuthenticateSessionUseCase } from './authenticate-session.use-case';

describe('AuthenticateSessionUseCase', () => {
  it('resuelve sesión, identidad y hogar en una sola consulta', async () => {
    const user = makeUser();
    const session = makeSession();
    const findBySessionTokenHash = vi.fn(async () => ({ user, session }));
    const useCase = new AuthenticateSessionUseCase(
      fakeUserRepository({ findBySessionTokenHash }),
      fixedClock,
    );

    const result = await useCase.tryExecuteWithSession('token-secreto');

    expect(findBySessionTokenHash).toHaveBeenCalledTimes(1);
    expect(findBySessionTokenHash).toHaveBeenCalledWith(sha256('token-secreto'), fixedClock.now());
    expect(result?.user).toBe(user);
    expect(result?.session).toBe(session);
  });

  it('sin cookie no consulta la base de datos', async () => {
    const findBySessionTokenHash = vi.fn();
    const useCase = new AuthenticateSessionUseCase(
      fakeUserRepository({ findBySessionTokenHash }),
      fixedClock,
    );

    await expect(useCase.tryExecuteWithSession(undefined)).resolves.toBeNull();
    expect(findBySessionTokenHash).not.toHaveBeenCalled();
  });
});
