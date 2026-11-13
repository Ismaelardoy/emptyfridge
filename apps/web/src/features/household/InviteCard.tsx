import type { AppOutletContext } from '@/app/ProtectedLayout';
import {
  buildInviteMessage,
  buildInviteUrl,
  canShareNatively,
  copyInviteLink,
  openWhatsApp,
  shareNatively,
} from '@/shared/lib/invite';
import { WhatsAppIcon } from '@/shared/ui/WhatsAppIcon';
import { Copy, Share2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Invitación discreta para la lista vacía. Sin tarjeta ni párrafos: solo el
 * botón de WhatsApp y, al lado, copiar o compartir. Todo ocurre aquí porque el
 * portapapeles y el compartir nativo necesitan el toque del usuario.
 */
export function InviteCard() {
  const { user } = useOutletContext<AppOutletContext>();
  const household = user.household;

  if (!household) {
    return null;
  }

  const inviteUrl = buildInviteUrl(household.inviteCode, window.location.origin);
  const message = buildInviteMessage(household.name, inviteUrl);

  const copy = async () => {
    if (await copyInviteLink(inviteUrl)) {
      toast.success('Enlace copiado');
    } else {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const share = async () => {
    const result = await shareNatively({
      title: 'Únete a nuestro hogar',
      text: 'Únete a nuestra lista de la compra',
      url: inviteUrl,
    });
    if (result === 'failed') {
      await copy();
    }
  };

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => openWhatsApp(message)}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-[#04331f] shadow-[0_8px_20px_-10px_rgba(37,211,102,0.9)] transition-colors hover:bg-[#20c95f] active:bg-[#1bbc58]"
      >
        <WhatsAppIcon className="h-4 w-4" />
        Compartir lista
      </button>

      <button
        type="button"
        onClick={() => void copy()}
        aria-label="Copiar enlace"
        title="Copiar enlace"
        className="flex h-10 w-10 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-200/60 hover:text-stone-600"
      >
        <Copy className="h-4 w-4" aria-hidden />
      </button>

      {canShareNatively() ? (
        <button
          type="button"
          onClick={() => void share()}
          aria-label="Más opciones para compartir"
          title="Más opciones para compartir"
          className="flex h-10 w-10 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-200/60 hover:text-stone-600"
        >
          <Share2 className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
