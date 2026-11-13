/**
 * Guardar el código de acceso en el gestor de contraseñas del móvil.
 *
 * Chrome/Edge/Android exponen `navigator.credentials.store`, que abre el
 * diálogo nativo «¿Guardar contraseña?» y sincroniza el código con la cuenta
 * del navegador. Safari (iOS y macOS) no soporta esta API: allí solo se puede
 * pedir al usuario que copie el código y lo guarde a mano.
 */

export type SaveCredentialResult = 'saved' | 'dismissed' | 'unsupported' | 'failed';

const PROMPTED_KEY = 'erfrigovacio:credential-save-prompted';
const USERNAME = 'erfrigovacio';

let promptedInMemory = false;

type PasswordCredentialConstructor = new (data: {
  id: string;
  name?: string;
  password: string;
}) => Credential;

function getPasswordCredential(): PasswordCredentialConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const candidate = (window as unknown as Record<string, unknown>).PasswordCredential;
  return typeof candidate === 'function' ? (candidate as PasswordCredentialConstructor) : null;
}

/** El código se guarda como contraseña de un «usuario» fijo del sitio. */
export function canSaveCredentials(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return getPasswordCredential() !== null && typeof navigator.credentials?.store === 'function';
}

/**
 * Abre el diálogo nativo de guardado. Best effort: si el navegador no lo
 * soporta o el usuario lo cancela, quien llama decide qué mostrar.
 */
export async function saveRecoveryCode(code: string): Promise<SaveCredentialResult> {
  const PasswordCredential = getPasswordCredential();
  if (!PasswordCredential || typeof navigator.credentials?.store !== 'function') {
    return 'unsupported';
  }

  try {
    const credential = new PasswordCredential({
      id: USERNAME,
      name: 'ErFrigovacio',
      password: code,
    });
    const stored = (await navigator.credentials.store(credential)) as Credential | null | undefined;
    return stored === null ? 'dismissed' : 'saved';
  } catch {
    return 'failed';
  }
}

/** Solo se pregunta una vez por dispositivo para no resultar pesado. */
export function shouldOfferSavePrompt(): boolean {
  if (!canSaveCredentials()) {
    return false;
  }

  if (promptedInMemory) {
    return false;
  }

  try {
    return window.localStorage.getItem(PROMPTED_KEY) !== '1';
  } catch {
    return true;
  }
}

export function markSavePromptShown(): void {
  promptedInMemory = true;
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(PROMPTED_KEY, '1');
  } catch {
    // Sin localStorage la marca vive solo en memoria durante esta sesión.
  }
}
