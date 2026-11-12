import { api } from '@/shared/api/client';
import type {
  AddItemInput,
  AddItemResultDto,
  CurrentListDto,
  FinishListResultDto,
  ItemResponseDto,
  MostUsedDto,
  SuggestionsDto,
  UpdateItemInput,
} from '@emptyfridge/contracts';

export function getCurrentList(): Promise<CurrentListDto> {
  return api<CurrentListDto>('/lists/current');
}

export function addItem(input: AddItemInput): Promise<AddItemResultDto> {
  return api<AddItemResultDto>('/lists/current/items', { method: 'POST', json: input });
}

export function updateItem(id: string, input: UpdateItemInput): Promise<ItemResponseDto> {
  return api<ItemResponseDto>(`/lists/items/${id}`, { method: 'PATCH', json: input });
}

export function deleteItem(id: string): Promise<void> {
  return api<void>(`/lists/items/${id}`, { method: 'DELETE' });
}

export function finishList(): Promise<FinishListResultDto> {
  return api<FinishListResultDto>('/lists/current/finish', { method: 'POST' });
}

export function getSuggestions(): Promise<SuggestionsDto> {
  return api<SuggestionsDto>('/lists/suggestions');
}

export function getMostUsed(): Promise<MostUsedDto> {
  return api<MostUsedDto>('/lists/most-used');
}
