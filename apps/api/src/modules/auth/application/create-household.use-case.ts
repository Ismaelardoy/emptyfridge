import type { CreateHouseholdInput } from '@emptyfridge/contracts';
import { MAX_INVITE_CODE_LENGTH } from '@emptyfridge/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type { Clock, IdGenerator } from '../../../shared/domain/ports';
import { CLOCK, ID_GENERATOR } from '../../../shared/domain/ports';
import { AppError } from '../../../shared/errors/app-error';
import type { User } from '../domain/household';
import { inviteCodeLengthFor } from '../domain/invite-code';
import { HOUSEHOLD_REPOSITORY, TOKEN_GENERATOR, USER_REPOSITORY } from '../domain/ports';
import type { HouseholdRepository, TokenGenerator, UserRepository } from '../domain/ports';

/** Si el código generado choca, probamos con uno más largo antes de rendirnos. */
const MAX_CODE_ATTEMPTS = 4;

@Injectable()
export class CreateHouseholdUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(HOUSEHOLD_REPOSITORY) private readonly households: HouseholdRepository,
    @Inject(TOKEN_GENERATOR) private readonly tokens: TokenGenerator,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
  ) {}

  async execute(actor: User, input: CreateHouseholdInput): Promise<User> {
    if (actor.membership) {
      throw AppError.conflict('ALREADY_IN_HOUSEHOLD', 'Ya estás en un hogar.');
    }

    const now = this.clock.now();
    const total = await this.households.count();
    let length = inviteCodeLengthFor(total);

    for (let attempt = 0; ; attempt += 1) {
      try {
        await this.households.createHouseholdWithOwner(
          {
            id: this.ids.next(),
            name: input.name,
            inviteCode: this.tokens.inviteCode(length),
            createdAt: now,
          },
          actor.id,
          now,
        );
        break;
      } catch (error) {
        const collision = error instanceof AppError && error.code === 'INVITE_CODE_COLLISION';
        if (!collision || attempt >= MAX_CODE_ATTEMPTS) {
          throw error;
        }
        // Un carácter más = 32 veces más espacio.
        length = Math.min(length + 1, MAX_INVITE_CODE_LENGTH);
      }
    }

    const updated = await this.users.findByIdWithMembership(actor.id);
    if (!updated) {
      throw AppError.notFound('USER_NOT_FOUND', 'Cuenta no encontrada.');
    }
    return updated;
  }
}
