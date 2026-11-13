import { promptInstall, useInstallPrompt } from '@/shared/lib/pwa-install';
import { Button } from '@/shared/ui/Button';
import { LogoMark } from '@/shared/ui/Logo';
import { Download, MoreVertical, Share2, X } from 'lucide-react';
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

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

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

  if (!open) {
    return null;
  }

  const GuideIcon =
    install.guide.icon === 'share'
      ? Share2
      : install.guide.icon === 'menu'
        ? MoreVertical
        : Download;

  return (
    <div className="install-sheet-dock pointer-events-none fixed inset-x-0 z-30 flex justify-center px-3 lg:left-64 lg:px-4">
      <dialog
        open
        aria-labelledby="install-sheet-title"
        className="install-sheet pointer-events-auto static m-0 max-h-[60dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[1.75rem] border border-stone-200/70 bg-white/95 p-4 shadow-[0_24px_60px_-24px_rgba(28,25,23,0.5)] backdrop-blur-xl"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-200" aria-hidden />

        {mode === 'intro' ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <LogoMark className="h-9 w-9" />
                <div className="min-w-0">
                  <h2 id="install-sheet-title" className="text-base font-bold text-stone-900">
                    Llévala en tu pantalla de inicio
                  </h2>
                  <p className="text-[11px] text-stone-400">Sin cuenta, como una app</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="shrink-0 rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-5 text-stone-600">
              Abre ErFrigovacio como una app, sin buscar el navegador. La lista sigue igual.
            </p>
            <p className="mt-1 text-[11px] leading-4 text-stone-400">
              No es otra cuenta ni se instala nada raro: es un acceso directo.
            </p>

            <div className="mt-3 space-y-2">
              <Button className="w-full" loading={installing} onClick={() => void handleAccept()}>
                {install.canPrompt ? 'Sí, añádela ahora' : 'Sí, ver cómo se hace'}
              </Button>
              <Button
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
                className="mt-2 w-full text-center text-[11px] font-medium text-stone-400 transition-colors hover:text-stone-600"
              >
                Prefiero hacerlo a mano
              </button>
            ) : null}
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <h2 id="install-sheet-title" className="text-base font-bold text-stone-900">
                Añádela en 3 pasos
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="shrink-0 rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {nativeDismissed ? (
              <p className="mt-2 text-[11px] leading-4 text-amber-700">
                El navegador no la ha añadido. Puedes hacerlo a mano:
              </p>
            ) : (
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-emerald-900 ring-1 ring-emerald-100">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700">
                  <GuideIcon className="h-4 w-4" />
                </span>
                <span className="text-[11px] font-semibold">{install.guide.device}</span>
              </div>
            )}

            <ol className="mt-3 space-y-2.5">
              {install.guide.steps.map((step, index) => (
                <li key={step} className="flex gap-2.5 text-[13px] leading-5 text-stone-600">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            {install.guide.note ? (
              <p className="mt-3 rounded-xl bg-stone-50 px-2.5 py-2 text-[11px] leading-4 text-stone-400">
                {install.guide.note}
              </p>
            ) : null}

            <Button className="mt-3 w-full" onClick={onClose}>
              Entendido
            </Button>

            <button
              type="button"
              onClick={() => setMode('intro')}
              className="mt-1.5 w-full text-center text-[11px] font-medium text-stone-400 transition-colors hover:text-stone-600"
            >
              Volver
            </button>
          </>
        )}
      </dialog>
    </div>
  );
}
