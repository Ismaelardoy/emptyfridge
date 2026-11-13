import { describe, expect, it } from 'vitest';
import { formatQuantity, formatRelativeTime, pluralize } from './format';

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

describe('formatRelativeTime', () => {
  const now = new Date('2026-01-15T10:00:00.000Z');

  it('muestra minutos, ayer y fechas antiguas', () => {
    expect(formatRelativeTime('2026-01-15T09:55:00.000Z', now)).toBe('hace 5 minutos');
    expect(formatRelativeTime('2026-01-14T10:00:00.000Z', now)).toBe('ayer');
  });

  it('devuelve ahora para hace unos segundos y vacío si la fecha no es válida', () => {
    expect(formatRelativeTime('2026-01-15T09:59:50.000Z', now)).toBe('ahora');
    expect(formatRelativeTime('no-es-una-fecha', now)).toBe('');
  });
});
