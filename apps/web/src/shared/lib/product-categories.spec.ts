import { type ItemDto, type ProductCategory, productCategories } from '@emptyfridge/contracts';
import { describe, expect, it } from 'vitest';
import {
  PRODUCT_CATEGORY_LABELS,
  groupItemsByCategory,
  resolveProductCategory,
} from './product-categories';

function makeItem(id: string, category: ProductCategory): ItemDto {
  return {
    id,
    listId: 'l1',
    name: id,
    quantity: null,
    unit: null,
    category,
    checked: false,
    addedBy: null,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
  };
}

describe('groupItemsByCategory', () => {
  it('ordena por pasillo y oculta las secciones vacías', () => {
    const groups = groupItemsByCategory([
      makeItem('Detergente', 'limpieza-hogar'),
      makeItem('Leche', 'lacteos-huevos'),
      makeItem('Manzana', 'frutas-verduras'),
      makeItem('Cerveza', 'bebidas'),
    ]);

    expect(groups.map((group) => group.category)).toEqual([
      'frutas-verduras',
      'lacteos-huevos',
      'bebidas',
      'limpieza-hogar',
    ]);
    expect(groups[0]?.items.map((item) => item.id)).toEqual(['Manzana']);
  });

  it('mantiene el orden de llegada dentro de cada sección', () => {
    const groups = groupItemsByCategory([
      makeItem('Leche', 'lacteos-huevos'),
      makeItem('Yogur', 'lacteos-huevos'),
    ]);

    expect(groups[0]?.items.map((item) => item.id)).toEqual(['Leche', 'Yogur']);
  });

  it('manda al final lo que no reconoce', () => {
    const unknown = { ...makeItem('Raro', 'otros'), category: 'nueva' as ProductCategory };

    expect(resolveProductCategory(unknown)).toBe('otros');
    expect(groupItemsByCategory([unknown])[0]?.category).toBe('otros');
  });

  it('tiene etiqueta para todas las secciones', () => {
    for (const category of productCategories) {
      expect(PRODUCT_CATEGORY_LABELS[category]).toBeTruthy();
    }
    expect(PRODUCT_CATEGORY_LABELS.otros).toBe('Otros');
  });
});
