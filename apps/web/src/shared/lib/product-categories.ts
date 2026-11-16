import { type ItemDto, type ProductCategory, productCategories } from '@emptyfridge/contracts';

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  'frutas-verduras': 'Frutas y verduras',
  panaderia: 'Panadería',
  carniceria: 'Carnicería',
  pescaderia: 'Pescadería',
  charcuteria: 'Charcutería',
  'lacteos-huevos': 'Lácteos y huevos',
  despensa: 'Despensa',
  congelados: 'Congelados',
  bebidas: 'Bebidas',
  'limpieza-hogar': 'Limpieza y hogar',
  'higiene-cuidado': 'Higiene y cuidado',
  bebes: 'Bebés',
  mascotas: 'Mascotas',
  otros: 'Otros',
};

const KNOWN_CATEGORIES = new Set<string>(productCategories);

/** Tolera respuestas antiguas o categorías nuevas desconocidas. */
export function resolveProductCategory(item: Pick<ItemDto, 'category'>): ProductCategory {
  return KNOWN_CATEGORIES.has(item.category) ? item.category : 'otros';
}

export interface CategoryGroup {
  category: ProductCategory;
  items: ItemDto[];
}

/** Agrupa en el orden de pasillo de `productCategories`, sin secciones vacías. */
export function groupItemsByCategory(items: readonly ItemDto[]): CategoryGroup[] {
  const buckets = new Map<ProductCategory, ItemDto[]>();

  for (const item of items) {
    const category = resolveProductCategory(item);
    const bucket = buckets.get(category);
    if (bucket) {
      bucket.push(item);
    } else {
      buckets.set(category, [item]);
    }
  }

  const groups: CategoryGroup[] = [];
  for (const category of productCategories) {
    const bucket = buckets.get(category);
    if (bucket && bucket.length > 0) {
      groups.push({ category, items: bucket });
    }
  }

  return groups;
}
