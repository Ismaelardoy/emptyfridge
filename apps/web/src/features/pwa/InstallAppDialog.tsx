import { promptInstall, useInstallPrompt } from '@/shared/lib/pwa-install';
import { Button } from '@/shared/ui/Button';
import { LogoMark } from '@/shared/ui/Logo';
import { Modal } from '@/shared/ui/Modal';
import { Download, MoreVertical, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type DialogMode = 'intro' | 'tutorial';

export function InstallAppDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const install = useInstallPrompt();
  const [mode, setMode] = useState<DialogMode>('intro');
  const [installing, setInstalling] = useState(false);
  const [nativeDismissed, setNativeDismissed] = useState(false);

  useEffect(() => {
    if (!open) {
      setMode('intro');
      setInstalling(false);
      setNativeDismissed(false);
    }
  }, [open]);

  const handleAccept = async () => {
    if (!install.canPrompt) {
      setMode('tutorial');
      return;
    }

    setInstalling(true);
    const result = await promptInstall();
    setInstalling(false);

    if (result === 'accepted') {
      toast.success('ErFrigovacio añadida a tu pantalla de inicio');
      onClose();
      return;
    }

    setNativeDismissed(result === 'dismissed');
    setMode('tutorial');
  };

  const GuideIcon =
    install.guide.icon === 'share'
      ? Share2
      : install.guide.icon === 'menu'
        ? MoreVertical
        : Download;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'intro' ? 'Llévala en tu pantalla de inicio' : 'Añádela en 3 pasos'}
    >
      {mode === 'intro' ? (
        <>
          <div className="flex flex-col items-center text-center">
            <LogoMark className="h-16 w-16" />
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Abre ErFrigovacio como una app, sin buscar el navegador. Se verá a pantalla completa y
              la lista seguirá igual.
            </p>
            <p className="mt-2 text-xs leading-5 text-stone-400">
              No es otra cuenta ni se instala nada raro: es un acceso directo.
            </p>
          </div>

          <div className="mt-5 space-y-2">
            <Button
              size="lg"
              className="w-full"
              loading={installing}
              onClick={() => void handleAccept()}
            >
              {install.canPrompt ? 'Sí, añádela ahora' : 'Sí, ver cómo se hace'}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="w-full"
              onClick={onClose}
              disabled={installing}
            >
              Ahora no
            </Button>
          </div>

          {install.canPrompt ? (
            <button
              type="button"
              onClick={() => setMode('tutorial')}
              className="mt-3 w-full text-center text-xs font-medium text-stone-400 transition-colors hover:text-stone-600"
            >
              Prefiero hacerlo a mano
            </button>
          ) : null}
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-3 py-2.5 text-emerald-900 ring-1 ring-emerald-100">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700">
              <GuideIcon className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold">{install.guide.device}</span>
          </div>

          {nativeDismissed ? (
            <p className="mt-3 text-xs leading-5 text-amber-700">
              El navegador no la ha añadido. Puedes hacerlo a mano:
            </p>
          ) : null}

          <ol className="mt-4 space-y-3">
            {install.guide.steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-6 text-stone-600">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          {install.guide.note ? (
            <p className="mt-4 rounded-2xl bg-stone-50 px-3 py-2 text-xs leading-5 text-stone-400">
              {install.guide.note}
            </p>
          ) : null}

          <Button size="lg" className="mt-5 w-full" onClick={onClose}>
            Entendido
          </Button>

          <button
            type="button"
            onClick={() => setMode('intro')}
            className="mt-2 w-full text-center text-xs font-medium text-stone-400 transition-colors hover:text-stone-600"
          >
            Volver
          </button>
        </>
      )}
    </Modal>
  );
}
