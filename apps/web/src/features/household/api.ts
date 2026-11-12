import { api } from '@/shared/api/client';
import type { HouseholdDto } from '@emptyfridge/contracts';

export function getHousehold(): Promise<HouseholdDto> {
  return api<HouseholdDto>('/household');
}

export function renameHousehold(name: string): Promise<void> {
  return api<void>('/household', { method: 'PATCH', json: { name } });
}

export function removeMember(id: string): Promise<void> {
  return api<void>(`/household/members/${id}`, { method: 'DELETE' });
}

export function transferOwnership(memberId: string): Promise<void> {
  return api<void>('/household/transfer-ownership', { method: 'POST', json: { memberId } });
}
