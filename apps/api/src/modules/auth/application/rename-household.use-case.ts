import type { RenameHouseholdInput } from '@emptyfridge/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../shared/errors/app-error';
import type { User } from '../domain/household';
import { HOUSEHOLD_REPOSITORY } from '../domain/ports';
import type { HouseholdRepository } from '../domain/ports';
import { requireMembership } from './household-actor';

@Injectable()
export class RenameHouseholdUseCase {
  constructor(@Inject(HOUSEHOLD_REPOSITORY) private readonly households: HouseholdRepository) {}

  async execute(actor: User, input: RenameHouseholdInput): Promise<void> {
    const membership = requireMembership(actor);
    if (membership.role !== 'owner') {
      throw AppError.forbidden('OWNER_ONLY', 'Solo el creador del hogar puede cambiar el nombre.');
    }

    const updated = await this.households.rename(membership.household.id, input.name);
    if (!updated) {
      throw AppError.notFound('HOUSEHOLD_NOT_FOUND', 'Hogar no encontrado.');
    }
  }
}
