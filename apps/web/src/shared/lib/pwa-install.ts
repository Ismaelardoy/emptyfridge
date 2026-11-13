import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type InstallGuideIcon = 'share' | 'menu' | 'install';

export interface InstallGuide {
  device: string;
  icon: InstallGuideIcon;
  steps: string[];
  note?: string;
}

export interface InstallPromptState {
  installed: boolean;
  canPrompt: boolean;
  guide: InstallGuide;
}

const SEEN_KEY = 'erfrigovacio:install-suggestion-seen';

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let appInstalled = false;
let seenInMemory = false;

const installListeners = new Set<() => void>();
const itemAddedListeners = new Set<() => void>();

function isIos(userAgent: string, platform: string, maxTouchPoints: number): boolean {
  return /iPad|iPhone|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

function isAndroid(userAgent: string): boolean {
  return /Android/i.test(userAgent);
}

/**
 * Instrucciones manuales por plataforma y navegador. Apple no permite lanzar
 * la instalación desde código, así que en iOS siempre se enseña el tutorial.
 */
export function detectInstallGuide(
  userAgent: string = typeof navigator === 'undefined' ? '' : navigator.userAgent,
  platform: string = typeof navigator === 'undefined' ? '' : navigator.platform,
  maxTouchPoints: number = typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints,
): InstallGuide {
  if (isIos(userAgent, platform, maxTouchPoints)) {
    const safari = /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);

    return {
      device: safari ? 'iPhone o iPad · Safari' : 'iPhone o iPad · navegador',
      icon: 'share',
      steps: [
        'Toca el botón Compartir (el cuadrado con la flecha hacia arriba).',
        'Baja y elige «Añadir a la pantalla de inicio».',
        'Toca «Añadir» arriba a la derecha.',
      ],
      note: 'En iPad el botón Compartir está arriba; en iPhone, abajo. El nombre puede cambiar según tu versión de iOS.',
    };
  }

  if (isAndroid(userAgent)) {
    if (/SamsungBrowser/i.test(userAgent)) {
      return {
        device: 'Android · Samsung Internet',
        icon: 'menu',
        steps: [
          'Toca el menú de tres líneas (≡), abajo.',
          'Elige «Añadir página a» y después «Pantalla de inicio».',
          'Confirma con «Añadir».',
        ],
        note: 'El menú puede cambiar de sitio según tu versión de Samsung Internet.',
      };
    }

    if (/Firefox/i.test(userAgent)) {
      return {
        device: 'Android · Firefox',
        icon: 'menu',
        steps: [
          'Toca el menú de tres puntos (⋮).',
          'Elige «Instalar» o «Añadir a pantalla de inicio».',
          'Confirma la opción.',
        ],
        note: 'El nombre cambia según la versión de Firefox.',
      };
    }

    return {
      device: 'Android · Chrome',
      icon: 'menu',
      steps: [
        'Toca el menú de tres puntos (⋮), arriba a la derecha.',
        'Elige «Instalar aplicación» o «Añadir a pantalla de inicio».',
        'Confirma con «Instalar» o «Añadir».',
      ],
      note: 'Si no ves esa opción, abre la lista en Chrome. El nombre cambia según la versión.',
    };
  }

  if (/Firefox/i.test(userAgent)) {
    return {
      device: 'Ordenador · Firefox',
      icon: 'install',
      steps: [
        'Abre el menú de tres líneas.',
        'Elige «Instalar sitio web como aplicación» si aparece.',
        'Si no aparece, abre ErFrigovacio en Chrome o Edge para instalarla.',
      ],
      note: 'Firefox no permite instalarla como app en todas las versiones.',
    };
  }

  if (/Edg\//i.test(userAgent) || /Chrome|Chromium/i.test(userAgent)) {
    return {
      device: 'Ordenador · Chrome o Edge',
      icon: 'install',
      steps: [
        'Busca el icono de instalar en la barra de direcciones (una pantalla con una flecha).',
        'Si no aparece, abre el menú del navegador y elige «Instalar ErFrigovacio».',
        'Confirma con «Instalar».',
      ],
      note: 'En algunos navegadores la opción se llama «Añadir a la pantalla de inicio» o «Crear acceso directo».',
    };
  }

  if (/Safari/i.test(userAgent)) {
    return {
      device: 'Mac · Safari',
      icon: 'install',
      steps: ['Abre el menú «Archivo».', 'Elige «Añadir al Dock».', 'Confirma.'],
      note: 'Disponible en macOS Sonoma o posterior. En versiones anteriores, usa Chrome o Edge.',
    };
  }

  return {
    device: 'Tu dispositivo',
    icon: 'install',
    steps: [
      'Abre el menú de tu navegador.',
      'Busca «Instalar aplicación», «Añadir a pantalla de inicio» o «Crear acceso directo».',
      'Confirma la opción.',
    ],
    note: 'El nombre cambia según el móvil y la versión del navegador.',
  };
}

export function isInstalledApp(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  if (navigatorWithStandalone.standalone === true) {
    return true;
  }

  return ['standalone', 'fullscreen', 'minimal-ui'].some(
    (mode) => window.matchMedia(`(display-mode: ${mode})`).matches,
  );
}

function getSnapshot(): InstallPromptState {
  return {
    installed: appInstalled || isInstalledApp(),
    canPrompt: deferredPrompt !== null,
    guide: detectInstallGuide(),
  };
}

function notifyInstallChange(): void {
  for (const listener of installListeners) {
    listener();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notifyInstallChange();
  });

  window.addEventListener('appinstalled', () => {
    appInstalled = true;
    deferredPrompt = null;
    notifyInstallChange();
  });
}

function subscribeInstall(listener: () => void): () => void {
  installListeners.add(listener);
  return () => {
    installListeners.delete(listener);
  };
}

export function useInstallPrompt(): InstallPromptState & {
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
} {
  const [state, setState] = useState<InstallPromptState>(getSnapshot);

  useEffect(() => {
    setState(getSnapshot());
    return subscribeInstall(() => setState(getSnapshot()));
  }, []);

  return { ...state, promptInstall };
}

/** Lanza el diálogo nativo. Solo existe en navegadores compatibles. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const prompt = deferredPrompt;
  if (!prompt) {
    return 'unavailable';
  }

  deferredPrompt = null;
  notifyInstallChange();

  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === 'accepted') {
      appInstalled = true;
      notifyInstallChange();
    }
    return choice.outcome;
  } catch {
    return 'unavailable';
  }
}

export function hasSeenInstallSuggestion(): boolean {
  if (seenInMemory || typeof window === 'undefined') {
    return seenInMemory;
  }

  try {
    return window.localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markInstallSuggestionSeen(): void {
  seenInMemory = true;
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Sin localStorage la marca vive solo en memoria durante esta sesión.
  }
}

/** Avisa de que se ha añadido un producto para sugerir la instalación. */
export function notifyItemAdded(): void {
  for (const listener of itemAddedListeners) {
    listener();
  }
}

export function subscribeItemAdded(listener: () => void): () => void {
  itemAddedListeners.add(listener);
  return () => {
    itemAddedListeners.delete(listener);
  };
}
