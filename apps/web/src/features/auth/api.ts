import { ApiError, api } from '@/shared/api/client';
import type {
  AuthResultDto,
  CreateHouseholdInput,
  JoinHouseholdInput,
  RecoverIdentityInput,
  RecoveryCodeDto,
  RedeemTransferInput,
  TransferTicketDto,
  UserDto,
} from '@emptyfridge/contracts';

export async function getMe(): Promise<UserDto | null> {
  try {
    const result = await api<AuthResultDto>('/auth/me');
    return result.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export function createHousehold(input: CreateHouseholdInput): Promise<AuthResultDto> {
  return api<AuthResultDto>('/quick/household', { method: 'POST', json: input });
}

export function joinHousehold(input: JoinHouseholdInput): Promise<AuthResultDto> {
  return api<AuthResultDto>('/quick/join', { method: 'POST', json: input });
}

export function createTransferTicket(): Promise<TransferTicketDto> {
  return api<TransferTicketDto>('/auth/transfer-token', { method: 'POST' });
}

export function redeemTransfer(input: RedeemTransferInput): Promise<AuthResultDto> {
  return api<AuthResultDto>('/quick/transfer', { method: 'POST', json: input });
}

export function createRecoveryCode(): Promise<RecoveryCodeDto> {
  return api<RecoveryCodeDto>('/auth/recovery-code', { method: 'POST' });
}

export function recoverIdentity(input: RecoverIdentityInput): Promise<AuthResultDto> {
  return api<AuthResultDto>('/quick/recover', { method: 'POST', json: input });
}

export function revokeOtherSessions(): Promise<void> {
  return api<void>('/auth/sessions/revoke-others', { method: 'POST' });
}

export function logout(): Promise<void> {
  return api<void>('/auth/logout', { method: 'POST' });
}
