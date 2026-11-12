import { Inject, Injectable } from '@nestjs/common';
import { sha256 } from '../../../shared/crypto';
import type { Clock } from '../../../shared/domain/ports';
import { CLOCK } from '../../../shared/domain/ports';
import { AppError } from '../../../shared/errors/app-error';
import type { Session, User } from '../domain/household';
import { SESSION_REPOSITORY, USER_REPOSITORY } from '../domain/ports';
import type { SessionRepository, UserRepository } from '../domain/ports';

export interface AuthenticatedSession {
  user: User;
  session: Session;
}

@Injectable()
export class AuthenticateSessionUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
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

    const session = await this.sessions.findValidByTokenHash(sha256(token), this.clock.now());
    if (!session) {
      return null;
    }

    const user = await this.users.findByIdWithMembership(session.userId);
    return user ? { user, session } : null;
  }
}
