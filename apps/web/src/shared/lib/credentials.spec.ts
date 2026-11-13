import { describe, expect, it } from 'vitest';
import { canSaveCredentials, saveRecoveryCode, shouldOfferSavePrompt } from './credentials';

describe('código de acceso y gestor de contraseñas', () => {
  it('no promete guardado cuando el navegador no expone la API', async () => {
    expect(canSaveCredentials()).toBe(false);
    expect(shouldOfferSavePrompt()).toBe(false);
    await expect(saveRecoveryCode('AAAA-BBBB-CCCC-DDDD')).resolves.toBe('unsupported');
  });
});
