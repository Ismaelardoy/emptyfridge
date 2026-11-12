import { describe, expect, it } from 'vitest';
import { inviteCodeLengthFor } from './invite-code';

describe('inviteCodeLengthFor', () => {
  it('usa 6 caracteres mientras hay pocos hogares', () => {
    expect(inviteCodeLengthFor(0)).toBe(6);
    expect(inviteCodeLengthFor(1_000)).toBe(6);
    expect(inviteCodeLengthFor(107_373)).toBe(6);
  });

  it('crece un carácter al llenar 1/10.000 del espacio', () => {
    expect(inviteCodeLengthFor(107_374)).toBe(7);
    expect(inviteCodeLengthFor(3_435_972)).toBe(7);
    expect(inviteCodeLengthFor(3_435_973)).toBe(8);
  });

  it('nunca pasa de 12 caracteres', () => {
    expect(inviteCodeLengthFor(Number.MAX_SAFE_INTEGER)).toBe(12);
  });
});
