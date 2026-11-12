import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../shared/errors/app-error';
import type { Household, HouseholdMember, User } from '../domain/household';
import { HOUSEHOLD_REPOSITORY } from '../domain/ports';
import type { HouseholdRepository } from '../domain/ports';
import { requireMembership } from './household-actor';

export interface HouseholdWithMembers {
  household: Household;
  members: HouseholdMember[];
}

@Injectable()
export class GetHouseholdUseCase {
  constructor(@Inject(HOUSEHOLD_REPOSITORY) private readonly households: HouseholdRepository) {}

  async execute(actor: User): Promise<HouseholdWithMembers> {
    const membership = requireMembership(actor);
    const members = await this.households.listMembers(membership.household.id);
    return { household: membership.household, members };
  }
}
