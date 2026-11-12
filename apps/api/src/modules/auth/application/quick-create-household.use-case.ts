import type { CreateHouseholdInput } from '@emptyfridge/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type { User } from '../domain/household';
import { USER_REPOSITORY } from '../domain/ports';
import type { UserRepository } from '../domain/ports';
import { CreateAnonymousUserUseCase } from './create-anonymous-user.use-case';
import { CreateHouseholdUseCase } from './create-household.use-case';
import type { IssuedSession } from './issue-session.use-case';
import { IssueSessionUseCase } from './issue-session.use-case';

export interface QuickAuthResult {
  user: User;
  session?: IssuedSession;
}

@Injectable()
export class QuickCreateHouseholdUseCase {
  constructor(
    private readonly createAnonymousUser: CreateAnonymousUserUseCase,
    private readonly createHousehold: CreateHouseholdUseCase,
    private readonly issueSession: IssueSessionUseCase,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(actor: User | null, input: CreateHouseholdInput): Promise<QuickAuthResult> {
    const user = actor ?? (await this.createAnonymousUser.execute());
    let updated: User;
    try {
      updated = await this.createHousehold.execute(user, input);
    } catch (error) {
      // Si acaba de nacer una identidad y no consigue crear el hogar, no la dejamos huérfana.
      if (!actor) {
        await this.users.deleteById(user.id);
      }
      throw error;
    }
    const session = actor ? undefined : await this.issueSession.execute(user.id);
    return { user: updated, session };
  }
}
