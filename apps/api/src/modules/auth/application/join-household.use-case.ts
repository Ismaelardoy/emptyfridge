import type { JoinHouseholdInput } from '@emptyfridge/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type { Clock } from '../../../shared/domain/ports';
import { CLOCK } from '../../../shared/domain/ports';
import { AppError } from '../../../shared/errors/app-error';
import type { User } from '../domain/household';
import { HOUSEHOLD_REPOSITORY, USER_REPOSITORY } from '../domain/ports';
import type { HouseholdRepository, UserRepository } from '../domain/ports';

@Injectable()
export class JoinHouseholdUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(HOUSEHOLD_REPOSITORY) private readonly households: HouseholdRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(actor: User, input: JoinHouseholdInput): Promise<User> {
    if (actor.membership) {
      throw AppError.conflict('ALREADY_IN_HOUSEHOLD', 'Ya estás en un hogar.');
    }

    const household = await this.households.findByInviteCode(input.inviteCode);
    if (!household) {
      throw AppError.notFound('INVITE_CODE_NOT_FOUND', 'Ese código de hogar no existe.');
    }

    // El primero que entra es co-propietario: si el creador pierde el acceso,
    // el hogar no se queda sin nadie que pueda gestionarlo.
    const members = await this.households.listMembers(household.id);
    const role = members.length <= 1 ? 'owner' : 'member';

    await this.households.addMember(household, actor.id, role, this.clock.now());

    const updated = await this.users.findByIdWithMembership(actor.id);
    if (!updated) {
      throw AppError.notFound('USER_NOT_FOUND', 'Cuenta no encontrada.');
    }
    return updated;
  }
}
