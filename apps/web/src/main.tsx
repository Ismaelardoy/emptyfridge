import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './app/styles.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('No se encontró el elemento #root');
}

/**
 * El service worker guarda la app para que funcione sin conexión, pero puede
 * dejar servida una versión antigua hasta la siguiente recarga. Si una versión
 * nueva toma el control, recargamos una vez para usarla ya.
 */
if ('serviceWorker' in navigator) {
  const hadController = navigator.serviceWorker.controller !== null;
  let reloading = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) {
      return;
    }
    reloading = true;
    window.location.reload();
  });

  // Busca actualizaciones al arrancar, al volver a la pestaña y cada hora.
  void navigator.serviceWorker.ready
    .then((registration) => {
      const check = () => {
        void registration.update().catch(() => {});
      };

      check();
      window.setInterval(check, 60 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          check();
        }
      });
    })
    .catch(() => {});
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
