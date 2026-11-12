import { describe, expect, it } from 'vitest';
import { randomInviteCode } from './crypto';

describe('randomInviteCode', () => {
  it('genera códigos de 6 caracteres sin 0, O, 1 ni I', () => {
    for (let index = 0; index < 100; index += 1) {
      expect(randomInviteCode()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    }
  });
});
