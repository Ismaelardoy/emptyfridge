import { AppError } from '../../../shared/errors/app-error';
import type { HouseholdActor, Membership, User } from '../domain/household';

export function requireMembership(user: User): Membership {
  if (!user.membership) {
    throw AppError.conflict(
      'NO_HOUSEHOLD',
      'Todavía no estás en un hogar. Crea uno o únete con un código.',
    );
  }
  return user.membership;
}

export function toHouseholdActor(user: User): HouseholdActor {
  const membership = requireMembership(user);

  return {
    id: user.id,
    displayName: user.displayName,
    householdId: membership.household.id,
    role: membership.role,
  };
}
