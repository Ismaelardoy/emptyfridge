import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../shared/errors/app-error';
import type { User } from '../domain/household';
import { HOUSEHOLD_REPOSITORY, USER_REPOSITORY } from '../domain/ports';
import type { HouseholdRepository, UserRepository } from '../domain/ports';
import { requireMembership } from './household-actor';

@Injectable()
export class RemoveMemberUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(HOUSEHOLD_REPOSITORY) private readonly households: HouseholdRepository,
  ) {}

  async execute(actor: User, targetUserId: string): Promise<void> {
    const membership = requireMembership(actor);

    if (actor.id === targetUserId) {
      throw AppError.conflict('CANNOT_REMOVE_SELF', 'No puedes expulsarte a ti mismo del hogar.');
    }

    const target = await this.users.findByIdWithMembership(targetUserId);
    if (!target || target.membership?.household.id !== membership.household.id) {
      throw AppError.notFound('MEMBER_NOT_FOUND', 'Ese miembro no está en tu hogar.');
    }

    const targetWasOwner = target.membership.role === 'owner';
    await this.households.removeMember(membership.household.id, targetUserId);

    // Cualquier miembro puede gestionar el hogar. Si se va el propietario,
    // el miembro más antiguo que queda toma el relevo para no dejar el hogar
    // sin nadie que pueda renombrarlo o ceder la propiedad.
    if (targetWasOwner) {
      const remaining = await this.households.listMembers(membership.household.id);
      const nextOwner = remaining[0];
      if (nextOwner) {
        await this.households.transferOwnership(membership.household.id, actor.id, nextOwner.id);
      }
    }

    // La identidad expulsada se queda sin hogar: se elimina también su cuenta.
    await this.users.deleteById(targetUserId);
  }
}
