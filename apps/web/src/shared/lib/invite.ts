/** Enlaces y acciones para invitar al hogar. */

export function buildInviteUrl(inviteCode: string, origin: string): string {
  return `${origin}/join/${inviteCode}`;
}

export function buildInviteMessage(householdName: string, inviteUrl: string): string {
  return `¡Únete a la lista de la compra de ${householdName} en erfrigovacio! ${inviteUrl}`;
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(message: string): void {
  window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
}

export function canShareNatively(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export type NativeShareResult = 'shared' | 'cancelled' | 'unavailable' | 'failed';

export async function shareNatively(data: ShareData): Promise<NativeShareResult> {
  if (!canShareNatively()) {
    return 'unavailable';
  }

  try {
    await navigator.share(data);
    return 'shared';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return 'cancelled';
    }
    return 'failed';
  }
}

export async function copyInviteLink(inviteUrl: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(inviteUrl);
    return true;
  } catch {
    return false;
  }
}
