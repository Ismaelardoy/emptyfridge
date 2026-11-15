import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './app/styles.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('No se encontró el elemento #root');
}

/** No recargamos mientras alguien escribe: se perdería lo tecleado. */
function isTyping(): boolean {
  const element = document.activeElement;
  return (
    element instanceof HTMLElement &&
    (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable)
  );
}

function reloadWhenIdle(attempt = 0): void {
  if (!isTyping() || attempt > 30) {
    window.location.reload();
    return;
  }
  window.setTimeout(() => reloadWhenIdle(attempt + 1), 1000);
}

/**
 * El service worker guarda la app para que funcione sin conexión, pero puede
 * dejar servida una versión antigua. Si una versión nueva toma el control,
 * recargamos una sola vez; si el usuario está escribiendo, esperamos a que
 * suelte el campo (máximo 30 s).
 */
if ('serviceWorker' in navigator) {
  const hadController = navigator.serviceWorker.controller !== null;
  let reloading = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) {
      return;
    }
    reloading = true;
    reloadWhenIdle();
  });

  // Al arrancar, al volver a la app (visible/pageshow/focus) y cada 15 min.
  // En una PWA de iOS muchas veces no hay navegación: estos eventos son los
  // que hacen que se entere de un despliegue nuevo sin cerrar la app.
  void navigator.serviceWorker.ready
    .then((registration) => {
      let lastCheck = 0;
      const check = (force = false) => {
        const now = Date.now();
        if (!force && now - lastCheck < 30_000) {
          return;
        }
        lastCheck = now;
        void registration.update().catch(() => {});
      };

      check(true);
      window.setInterval(() => check(), 15 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          check();
        }
      });
      window.addEventListener('pageshow', () => check());
      window.addEventListener('focus', () => check());
    })
    .catch(() => {});
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
