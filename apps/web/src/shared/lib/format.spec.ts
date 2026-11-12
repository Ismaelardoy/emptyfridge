import { describe, expect, it } from 'vitest';
import { formatQuantity, pluralize } from './format';

describe('formatQuantity', () => {
  it('omite la cantidad cuando no hay datos', () => {
    expect(formatQuantity(null, null)).toBeNull();
  });

  it('usa 1 ud por defecto si solo hay unidad', () => {
    expect(formatQuantity(null, 'kg')).toBe('1 kg');
  });

  it('formatea decimales sin ceros sobrantes', () => {
    expect(formatQuantity(1.5, 'kg')).toBe('1.5 kg');
    expect(formatQuantity(2, 'ud')).toBe('2 ud');
  });
});

describe('pluralize', () => {
  it('elige singular y plural', () => {
    expect(pluralize(1, 'producto', 'productos')).toBe('producto');
    expect(pluralize(2, 'producto', 'productos')).toBe('productos');
  });
});
