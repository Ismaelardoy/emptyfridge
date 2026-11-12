import type { CreateHouseholdInput } from '@emptyfridge/contracts';
import { Injectable } from '@nestjs/common';
import type { User } from '../domain/household';
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
  ) {}

  async execute(actor: User | null, input: CreateHouseholdInput): Promise<QuickAuthResult> {
    const user = actor ?? (await this.createAnonymousUser.execute());
    const updated = await this.createHousehold.execute(user, input);
    const session = actor ? undefined : await this.issueSession.execute(user.id);
    return { user: updated, session };
  }
}
