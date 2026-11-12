/**
 * Clave de comparación para nombres de usuario.
 * Ignora mayúsculas, tildes y espacios duplicados para evitar duplicados
 * del tipo "José" / "jose".
 */
export function normalizeDisplayName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
