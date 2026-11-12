import {
  type HouseholdDto,
  type RecoveryCodeDto,
  type TransferTicketDto,
  type UserDto,
  formatRecoveryCode,
  formatTransferCode,
} from '@emptyfridge/contracts';
import type { TransferTicket } from '../application/create-transfer-token.use-case';
import type { Household, HouseholdMember, User } from '../domain/household';

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    displayName: user.displayName,
    household: user.membership
      ? {
          id: user.membership.household.id,
          name: user.membership.household.name,
          inviteCode: user.membership.household.inviteCode,
          role: user.membership.role,
        }
      : null,
  };
}

export function toHouseholdDto(household: Household, members: HouseholdMember[]): HouseholdDto {
  return {
    household: {
      id: household.id,
      name: household.name,
      inviteCode: household.inviteCode,
    },
    members: members.map((member) => ({
      id: member.id,
      displayName: member.displayName,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
    })),
  };
}

export function toTransferTicketDto(ticket: TransferTicket): TransferTicketDto {
  return {
    code: formatTransferCode(ticket.code),
    expiresAt: ticket.expiresAt.toISOString(),
  };
}

export function toRecoveryCodeDto(code: string): RecoveryCodeDto {
  return { code: formatRecoveryCode(code) };
}
