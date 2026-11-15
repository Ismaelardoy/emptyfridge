import { Inject, Injectable } from '@nestjs/common';
import { sha256 } from '../../../shared/crypto';
import type { Clock } from '../../../shared/domain/ports';
import { CLOCK } from '../../../shared/domain/ports';
import { AppError } from '../../../shared/errors/app-error';
import type { Session, User } from '../domain/household';
import { USER_REPOSITORY } from '../domain/ports';
import type { UserRepository } from '../domain/ports';

export interface AuthenticatedSession {
  user: User;
  session: Session;
}

@Injectable()
export class AuthenticateSessionUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(token: string | undefined): Promise<User> {
    const user = await this.tryExecute(token);
    if (!user) {
      throw AppError.unauthorized('Tu sesión ha caducado. Vuelve a entrar.');
    }
    return user;
  }

  async tryExecute(token: string | undefined): Promise<User | null> {
    const result = await this.tryExecuteWithSession(token);
    return result?.user ?? null;
  }

  /** Igual que `tryExecute`, pero también devuelve la sesión para poder renovarla. */
  async tryExecuteWithSession(token: string | undefined): Promise<AuthenticatedSession | null> {
    if (!token) {
      return null;
    }

    // Sesión + identidad + hogar en una sola consulta: esto corre en cada
    // petición autenticada, incluido el sondeo de la lista cada 3 s.
    return this.users.findBySessionTokenHash(sha256(token), this.clock.now());
  }
}
