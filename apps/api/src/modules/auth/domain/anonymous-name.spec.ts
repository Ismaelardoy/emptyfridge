import { describe, expect, it } from 'vitest';
import { randomAnonymousName } from './anonymous-name';

describe('randomAnonymousName', () => {
  it('genera un nombre corto y legible', () => {
    for (let index = 0; index < 20; index += 1) {
      const name = randomAnonymousName();
      expect(name).toMatch(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+ \d{3,4}$/);
      expect(name.length).toBeLessThanOrEqual(40);
    }
  });
});
