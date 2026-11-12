import type { RenameDisplayNameInput } from '@emptyfridge/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type { User } from '../domain/household';
import { normalizeDisplayName } from '../domain/normalize-display-name';
import { USER_REPOSITORY } from '../domain/ports';
import type { UserRepository } from '../domain/ports';

/** Cambia el nombre visible de la identidad anónima. No crea una cuenta. */
@Injectable()
export class RenameDisplayNameUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(actor: User, input: RenameDisplayNameInput): Promise<User> {
    const displayName = input.displayName.trim();
    const displayNameKey = normalizeDisplayName(displayName);

    await this.users.updateDisplayName(actor.id, displayName, displayNameKey);

    return { ...actor, displayName, displayNameKey };
  }
}
