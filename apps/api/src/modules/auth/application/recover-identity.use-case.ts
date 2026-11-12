import type { RecoverIdentityInput } from '@emptyfridge/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { sha256 } from '../../../shared/crypto';
import { AppError } from '../../../shared/errors/app-error';
import type { User } from '../domain/household';
import { USER_REPOSITORY } from '../domain/ports';
import type { UserRepository } from '../domain/ports';
import type { IssuedSession } from './issue-session.use-case';
import { IssueSessionUseCase } from './issue-session.use-case';

const INVALID_CODE = 'Ese código de recuperación no es válido. Revisa que esté completo.';

export interface RecoveredIdentity {
  user: User;
  session: IssuedSession;
}

@Injectable()
export class RecoverIdentityUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly issueSession: IssueSessionUseCase,
  ) {}

  async execute(actor: User | null, input: RecoverIdentityInput): Promise<RecoveredIdentity> {
    if (actor?.membership) {
      throw AppError.conflict('ALREADY_IN_HOUSEHOLD', 'Este dispositivo ya tiene una lista.');
    }

    const user = await this.users.findByRecoveryCodeHash(sha256(input.code));
    if (!user) {
      throw AppError.notFound('RECOVERY_CODE_INVALID', INVALID_CODE);
    }

    const session = await this.issueSession.execute(user.id);
    return { user, session };
  }
}
