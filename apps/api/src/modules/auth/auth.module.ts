import { Global, Module } from '@nestjs/common';
import { AuthenticateSessionUseCase } from './application/authenticate-session.use-case';
import { CreateAnonymousUserUseCase } from './application/create-anonymous-user.use-case';
import { CreateHouseholdUseCase } from './application/create-household.use-case';
import { CreateTransferTokenUseCase } from './application/create-transfer-token.use-case';
import { GenerateRecoveryCodeUseCase } from './application/generate-recovery-code.use-case';
import { GetHouseholdUseCase } from './application/get-household.use-case';
import { IssueSessionUseCase } from './application/issue-session.use-case';
import { JoinHouseholdUseCase } from './application/join-household.use-case';
import { LogoutUseCase } from './application/logout.use-case';
import { QuickCreateHouseholdUseCase } from './application/quick-create-household.use-case';
import { QuickJoinHouseholdUseCase } from './application/quick-join-household.use-case';
import { RecoverIdentityUseCase } from './application/recover-identity.use-case';
import { RedeemTransferTokenUseCase } from './application/redeem-transfer-token.use-case';
import { RemoveMemberUseCase } from './application/remove-member.use-case';
import { RenameDisplayNameUseCase } from './application/rename-display-name.use-case';
import { RenameHouseholdUseCase } from './application/rename-household.use-case';
import { RevokeOtherSessionsUseCase } from './application/revoke-other-sessions.use-case';
import { TransferOwnershipUseCase } from './application/transfer-ownership.use-case';
import {
  HOUSEHOLD_REPOSITORY,
  SESSION_REPOSITORY,
  TOKEN_GENERATOR,
  TRANSFER_TOKEN_REPOSITORY,
  USER_REPOSITORY,
} from './domain/ports';
import { CryptoTokenGenerator } from './infrastructure/crypto-token-generator';
import { DrizzleHouseholdRepository } from './infrastructure/drizzle-household.repository';
import { DrizzleSessionRepository } from './infrastructure/drizzle-session.repository';
import { DrizzleTransferTokenRepository } from './infrastructure/drizzle-transfer-token.repository';
import { DrizzleUserRepository } from './infrastructure/drizzle-user.repository';
import { AuthRateLimitGuard } from './interface/auth-rate-limit.guard';
import { AuthController } from './interface/auth.controller';
import { AuthGuard } from './interface/auth.guard';
import { HouseholdController } from './interface/household.controller';
import { QuickController } from './interface/quick.controller';

@Global()
@Module({
  controllers: [AuthController, HouseholdController, QuickController],
  providers: [
    CreateAnonymousUserUseCase,
    CreateHouseholdUseCase,
    JoinHouseholdUseCase,
    QuickCreateHouseholdUseCase,
    QuickJoinHouseholdUseCase,
    LogoutUseCase,
    IssueSessionUseCase,
    AuthenticateSessionUseCase,
    GetHouseholdUseCase,
    RenameHouseholdUseCase,
    RenameDisplayNameUseCase,
    RemoveMemberUseCase,
    CreateTransferTokenUseCase,
    RedeemTransferTokenUseCase,
    GenerateRecoveryCodeUseCase,
    RecoverIdentityUseCase,
    RevokeOtherSessionsUseCase,
    TransferOwnershipUseCase,
    AuthGuard,
    AuthRateLimitGuard,
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepository },
    { provide: HOUSEHOLD_REPOSITORY, useClass: DrizzleHouseholdRepository },
    { provide: SESSION_REPOSITORY, useClass: DrizzleSessionRepository },
    { provide: TRANSFER_TOKEN_REPOSITORY, useClass: DrizzleTransferTokenRepository },
    { provide: TOKEN_GENERATOR, useClass: CryptoTokenGenerator },
  ],
  exports: [AuthGuard, AuthRateLimitGuard, AuthenticateSessionUseCase, HOUSEHOLD_REPOSITORY],
})
export class AuthModule {}
