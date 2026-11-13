import {
  hasSeenInstallSuggestion,
  markInstallSuggestionSeen,
  subscribeItemAdded,
  useInstallPrompt,
} from '@/shared/lib/pwa-install';
import { type ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { InstallAppDialog } from './InstallAppDialog';

/**
 * Sugiere instalar la PWA justo después de añadir el primer producto en este
 * dispositivo. Solo se muestra una vez y nunca si ya se abrió como app.
 */
export function InstallAppProvider({ children }: { children: ReactNode }) {
  const install = useInstallPrompt();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // La sugerencia es un aviso suave: si cambias de página, desaparece.
    if (location.pathname) {
      setOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (install.installed) {
      setOpen(false);
    }
  }, [install.installed]);

  useEffect(() => {
    return subscribeItemAdded(() => {
      if (hasSeenInstallSuggestion()) {
        return;
      }

      markInstallSuggestionSeen();
      if (install.installed) {
        return;
      }

      // Cierra el teclado móvil antes de abrir el diálogo.
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setOpen(true);
    });
  }, [install.installed]);

  return (
    <>
      {children}
      <InstallAppDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
