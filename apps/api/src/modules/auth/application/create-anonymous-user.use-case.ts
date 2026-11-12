import { Inject, Injectable } from '@nestjs/common';
import type { Clock, IdGenerator } from '../../../shared/domain/ports';
import { CLOCK, ID_GENERATOR } from '../../../shared/domain/ports';
import { AppError } from '../../../shared/errors/app-error';
import { randomAnonymousName } from '../domain/anonymous-name';
import type { User } from '../domain/household';
import { normalizeDisplayName } from '../domain/normalize-display-name';
import { USER_REPOSITORY } from '../domain/ports';
import type { UserRepository } from '../domain/ports';

@Injectable()
export class CreateAnonymousUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
  ) {}

  async execute(): Promise<User> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const displayName = randomAnonymousName();
      try {
        return await this.users.create({
          id: this.ids.next(),
          displayName,
          displayNameKey: normalizeDisplayName(displayName),
          createdAt: this.clock.now(),
        });
      } catch (error) {
        if (error instanceof AppError && error.code === 'DISPLAY_NAME_TAKEN') {
          continue;
        }
        throw error;
      }
    }

    throw AppError.conflict(
      'ANONYMOUS_NAME_FAILED',
      'No se pudo crear tu identidad. Inténtalo de nuevo.',
    );
  }
}
