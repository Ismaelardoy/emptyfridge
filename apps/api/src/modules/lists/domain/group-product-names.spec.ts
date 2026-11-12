import { describe, expect, it } from 'vitest';
import { canonicalProductKey, groupProductNames } from './group-product-names';

describe('canonicalProductKey', () => {
  it('junta plurales y variantes con tildes', () => {
    expect(canonicalProductKey('Huevos')).toBe(canonicalProductKey('huevo'));
    expect(canonicalProductKey('Plátanos')).toBe(canonicalProductKey('platano'));
    expect(canonicalProductKey('Tomates')).toBe(canonicalProductKey('tomate'));
    expect(canonicalProductKey('Limones')).toBe(canonicalProductKey('limón'));
    expect(canonicalProductKey('Arroces')).toBe(canonicalProductKey('arroz'));
  });

  it('ignora palabras vacías y el orden', () => {
    expect(canonicalProductKey('aceite de oliva')).toBe(canonicalProductKey('oliva aceite'));
  });

  it('no junta productos realmente distintos', () => {
    expect(canonicalProductKey('leche')).not.toBe(canonicalProductKey('leche entera'));
    expect(canonicalProductKey('pan')).not.toBe(canonicalProductKey('pan de molde'));
  });
});

describe('groupProductNames', () => {
  it('suma huevo y huevos en una sola entrada', () => {
    const result = groupProductNames([
      { name: 'Huevos', count: 3 },
      { name: 'huevo', count: 2 },
      { name: 'Leche', count: 4 },
    ]);

    expect(result).toEqual([
      { name: 'Huevos', count: 5 },
      { name: 'Leche', count: 4 },
    ]);
  });

  it('junta erratas de una letra', () => {
    const result = groupProductNames([
      { name: 'huevo', count: 1 },
      { name: 'huebo', count: 1 },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.count).toBe(2);
  });

  it('ordena por más usado', () => {
    const result = groupProductNames([
      { name: 'Pan', count: 2 },
      { name: 'Leche', count: 5 },
      { name: 'Huevos', count: 3 },
    ]);

    expect(result.map((entry) => entry.name)).toEqual(['Leche', 'Huevos', 'Pan']);
  });
});
