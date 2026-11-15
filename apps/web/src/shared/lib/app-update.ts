export type UpdateCheckResult = 'unsupported' | 'none' | 'updating' | 'error';

/**
 * Fuerza una comprobación de versión del service worker.
 *
 * `sw.js` se genera con `skipWaiting` + `clientsClaim`, así que cuando el
 * navegador encuentra uno nuevo lo activa y dispara `controllerchange`; el
 * `main.tsx` recarga la página. Aquí solo hay que provocar la búsqueda y saber
 * si había algo nuevo para avisar al usuario.
 */
export async function checkForUpdate(timeoutMs = 3000): Promise<UpdateCheckResult> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return 'unsupported';
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    return 'unsupported';
  }

  // Ya había una actualización descargada o en curso.
  if (registration.installing || registration.waiting) {
    return 'updating';
  }

  const found = new Promise<boolean>((resolve) => {
    const timer = window.setTimeout(() => {
      registration.removeEventListener('updatefound', onFound);
      resolve(false);
    }, timeoutMs);

    const onFound = () => {
      window.clearTimeout(timer);
      registration.removeEventListener('updatefound', onFound);
      resolve(true);
    };

    registration.addEventListener('updatefound', onFound);
  });

  try {
    await registration.update();
  } catch {
    return 'error';
  }

  return (await found) ? 'updating' : 'none';
}
