import { api, parseApiResponse, requestApi } from '@/shared/api/client';
import type {
  AddItemInput,
  AddItemResultDto,
  CurrentListDto,
  FinishListResultDto,
  ItemResponseDto,
  MostUsedDto,
  UpdateItemInput,
} from '@emptyfridge/contracts';

/**
 * ETag de la última respuesta completa. El sondeo de 3 s lo reenvía y el
 * servidor contesta 304 sin cuerpo cuando nada ha cambiado.
 */
let currentListEtag: string | null = null;

export async function getCurrentList(previous?: CurrentListDto): Promise<CurrentListDto> {
  const response = await requestApi('/lists/current', {
    headers: currentListEtag ? { 'if-none-match': currentListEtag } : undefined,
  });

  if (response.status === 304) {
    // Sirve la copia viva de la caché (incluye cambios optimistas). Si no hay
    // copia, se repite sin ETag para no quedarnos congelados.
    if (previous) {
      return previous;
    }
    currentListEtag = null;
    return getCurrentList();
  }

  const data = await parseApiResponse<CurrentListDto>(response);
  currentListEtag = response.headers.get('etag');
  return data;
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

export function reopenList(listId: string): Promise<void> {
  return api<void>(`/lists/${listId}/reopen`, { method: 'POST' });
}

export function getMostUsed(): Promise<MostUsedDto> {
  return api<MostUsedDto>('/lists/most-used');
}
