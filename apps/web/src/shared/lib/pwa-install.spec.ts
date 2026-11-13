import { describe, expect, it } from 'vitest';
import { detectInstallGuide } from './pwa-install';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const IPAD_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const SAMSUNG_INTERNET =
  'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36';
const DESKTOP_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const DESKTOP_FIREFOX =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0';

describe('detectInstallGuide', () => {
  it('reconoce iPhone y iPad con el tutorial de Compartir', () => {
    const iphone = detectInstallGuide(IPHONE_SAFARI, 'iPhone', 5);
    const ipad = detectInstallGuide(IPAD_SAFARI, 'MacIntel', 5);

    expect(iphone.device).toContain('Safari');
    expect(ipad.device).toContain('Safari');
    expect(iphone.icon).toBe('share');
    expect(iphone.steps).toHaveLength(3);
  });

  it('reconoce Android Chrome y Samsung Internet', () => {
    const chrome = detectInstallGuide(ANDROID_CHROME, 'Linux armv8l', 5);
    const samsung = detectInstallGuide(SAMSUNG_INTERNET, 'Linux armv8l', 5);

    expect(chrome.device).toContain('Chrome');
    expect(samsung.device).toContain('Samsung');
    expect(chrome.icon).toBe('menu');
  });

  it('distingue escritorio Chrome y Firefox', () => {
    const chrome = detectInstallGuide(DESKTOP_CHROME, 'Win32', 0);
    const firefox = detectInstallGuide(DESKTOP_FIREFOX, 'Win32', 0);

    expect(chrome.device).toContain('Chrome');
    expect(firefox.device).toContain('Firefox');
    expect(chrome.icon).toBe('install');
  });
});
