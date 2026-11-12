import type { RedeemTransferInput } from '@emptyfridge/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { sha256 } from '../../../shared/crypto';
import type { Clock } from '../../../shared/domain/ports';
import { CLOCK } from '../../../shared/domain/ports';
import { AppError } from '../../../shared/errors/app-error';
import type { User } from '../domain/household';
import { TRANSFER_TOKEN_REPOSITORY, USER_REPOSITORY } from '../domain/ports';
import type { TransferTokenRepository, UserRepository } from '../domain/ports';
import type { IssuedSession } from './issue-session.use-case';
import { IssueSessionUseCase } from './issue-session.use-case';

const INVALID_CODE = 'Ese enlace ya no sirve o ha caducado. Genera uno nuevo en el móvil original.';

export interface RedeemedTransfer {
  user: User;
  session: IssuedSession;
}

@Injectable()
export class RedeemTransferTokenUseCase {
  constructor(
    @Inject(TRANSFER_TOKEN_REPOSITORY) private readonly transferTokens: TransferTokenRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly issueSession: IssueSessionUseCase,
  ) {}

  async execute(actor: User | null, input: RedeemTransferInput): Promise<RedeemedTransfer> {
    // No cambiamos la identidad de un dispositivo que ya está dentro de un hogar.
    if (actor?.membership) {
      throw AppError.conflict('ALREADY_IN_HOUSEHOLD', 'Este dispositivo ya tiene una lista.');
    }

    const token = await this.transferTokens.consume(sha256(input.code), this.clock.now());
    if (!token) {
      throw AppError.notFound('TRANSFER_CODE_INVALID', INVALID_CODE);
    }

    const user = await this.users.findByIdWithMembership(token.userId);
    if (!user) {
      throw AppError.notFound('TRANSFER_CODE_INVALID', INVALID_CODE);
    }

    const session = await this.issueSession.execute(user.id);
    return { user, session };
  }
}
