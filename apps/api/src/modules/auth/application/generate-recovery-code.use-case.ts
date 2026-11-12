import { Inject, Injectable } from '@nestjs/common';
import { sha256 } from '../../../shared/crypto';
import { AppError } from '../../../shared/errors/app-error';
import type { User } from '../domain/household';
import { TOKEN_GENERATOR, USER_REPOSITORY } from '../domain/ports';
import type { TokenGenerator, UserRepository } from '../domain/ports';

const MAX_ATTEMPTS = 3;

/**
 * Genera un código de recuperación nuevo y guarda solo su hash.
 * Cada vez que se genera uno, el anterior deja de funcionar.
 */
@Injectable()
export class GenerateRecoveryCodeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(TOKEN_GENERATOR) private readonly tokens: TokenGenerator,
  ) {}

  async execute(user: User): Promise<{ code: string }> {
    for (let attempt = 0; ; attempt += 1) {
      const code = this.tokens.recoveryCode();
      try {
        await this.users.updateRecoveryCode(user.id, code, sha256(code));
        return { code };
      } catch (error) {
        const collision = error instanceof AppError && error.code === 'RECOVERY_CODE_COLLISION';
        if (!collision || attempt >= MAX_ATTEMPTS) {
          throw error;
        }
      }
    }
  }
}
