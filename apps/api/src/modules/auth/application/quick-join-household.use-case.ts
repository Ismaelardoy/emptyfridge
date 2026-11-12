import type { JoinHouseholdInput } from '@emptyfridge/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../shared/errors/app-error';
import type { User } from '../domain/household';
import { HOUSEHOLD_REPOSITORY, USER_REPOSITORY } from '../domain/ports';
import type { HouseholdRepository, UserRepository } from '../domain/ports';
import { CreateAnonymousUserUseCase } from './create-anonymous-user.use-case';
import type { IssuedSession } from './issue-session.use-case';
import { IssueSessionUseCase } from './issue-session.use-case';
import { JoinHouseholdUseCase } from './join-household.use-case';

export interface QuickJoinResult {
  user: User;
  session?: IssuedSession;
}

@Injectable()
export class QuickJoinHouseholdUseCase {
  constructor(
    private readonly createAnonymousUser: CreateAnonymousUserUseCase,
    private readonly joinHousehold: JoinHouseholdUseCase,
    private readonly issueSession: IssueSessionUseCase,
    @Inject(HOUSEHOLD_REPOSITORY) private readonly households: HouseholdRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(actor: User | null, input: JoinHouseholdInput): Promise<QuickJoinResult> {
    if (actor?.membership) {
      const household = await this.households.findByInviteCode(input.inviteCode);
      if (household && household.id === actor.membership.household.id) {
        return { user: actor };
      }
      throw AppError.conflict('ALREADY_IN_HOUSEHOLD', 'Ya estás en otro hogar.');
    }

    const user = actor ?? (await this.createAnonymousUser.execute());
    let updated: User;
    try {
      updated = await this.joinHousehold.execute(user, input);
    } catch (error) {
      // Si acaba de nacer una identidad y no consigue entrar, no la dejamos huérfana.
      if (!actor) {
        await this.users.deleteById(user.id);
      }
      throw error;
    }
    const session = actor ? undefined : await this.issueSession.execute(user.id);
    return { user: updated, session };
  }
}
