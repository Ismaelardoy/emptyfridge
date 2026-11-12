import { Inject, Injectable } from '@nestjs/common';
import { sha256 } from '../../../shared/crypto';
import { AppError } from '../../../shared/errors/app-error';
import type { User } from '../domain/household';
import { SESSION_REPOSITORY } from '../domain/ports';
import type { SessionRepository } from '../domain/ports';

/**
 * Cierra la sesión en el resto de dispositivos, pero mantiene la actual.
 * Útil si pierdes o te roban un móvil.
 */
@Injectable()
export class RevokeOtherSessionsUseCase {
  constructor(@Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository) {}

  async execute(user: User, currentToken: string | undefined): Promise<number> {
    if (!currentToken) {
      throw AppError.unauthorized('Tu sesión ha caducado. Vuelve a entrar.');
    }

    return this.sessions.deleteOthers(user.id, sha256(currentToken));
  }
}
