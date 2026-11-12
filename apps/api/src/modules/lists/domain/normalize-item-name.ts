/**
 * Clave de comparación de productos. Ignora mayúsculas, tildes y espacios
 * duplicados para que "Leche" y "  leche " sean el mismo producto.
 */
export function normalizeItemName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
