import { describe, expect, it } from 'vitest';
import { normalizeItemName } from './normalize-item-name';

describe('normalizeItemName', () => {
  it('ignora mayúsculas, tildes y espacios sobrantes', () => {
    expect(normalizeItemName('  PlátaNos   de   Canarias ')).toBe('platanos de canarias');
  });

  it('mantiene nombres que ya son normales', () => {
    expect(normalizeItemName('leche entera')).toBe('leche entera');
  });
});
