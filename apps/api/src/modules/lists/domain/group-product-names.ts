import { normalizeItemName } from './normalize-item-name';

export interface ProductUsage {
  name: string;
  count: number;
}

const STOP_WORDS = new Set([
  'a',
  'al',
  'con',
  'de',
  'del',
  'el',
  'en',
  'la',
  'las',
  'los',
  'para',
  'por',
  'sin',
  'un',
  'una',
  'unas',
  'unos',
  'y',
]);

/**
 * Singulariza palabras frecuentes de la compra sin necesitar un diccionario.
 * "huevos" → "huevo", "tomates" → "tomate", "limones" → "limon",
 * "arroces" → "arroz", "panes" → "pan".
 */
function singularizeToken(token: string): string {
  if (token.length <= 3) {
    return token;
  }

  if (token.endsWith('ces') && token.length > 4) {
    return `${token.slice(0, -3)}z`;
  }

  if (/(ches|ques|gues)$/.test(token)) {
    return token.slice(0, -1);
  }

  if (token.endsWith('es') && token.length > 4 && !/[aeiou]tes$/.test(token)) {
    return token.slice(0, -2);
  }

  if (token.endsWith('s') && token.length > 3) {
    return token.slice(0, -1);
  }

  return token;
}

/** Clave que junta plurales, tildes, mayúsculas, puntuación y palabras vacías. */
export function canonicalProductKey(value: string): string {
  const normalized = normalizeItemName(value)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized
    .split(' ')
    .filter(Boolean)
    .map(singularizeToken)
    .filter((token) => !STOP_WORDS.has(token))
    .sort()
    .join(' ');
}

function levenshtein(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        (current[j - 1] ?? 0) + 1,
        (previous[j] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length] ?? Math.max(left.length, right.length);
}

function similarityOfKeys(left: string, right: string): number {
  if (left === right) {
    return 1;
  }
  const longest = Math.max(left.length, right.length);
  if (longest === 0) {
    return 1;
  }
  return 1 - levenshtein(left, right) / longest;
}

/**
 * Agrupa productos por parecido razonable. No hace magia semántica:
 * junta plurales, errores de una letra y frases con/sin palabras vacías.
 */
export function groupProductNames(rows: ProductUsage[], threshold = 0.8): ProductUsage[] {
  const ordered = [...rows].sort(
    (left, right) => right.count - left.count || left.name.localeCompare(right.name, 'es'),
  );
  const clusters: { key: string; name: string; count: number }[] = [];

  for (const row of ordered) {
    const key = canonicalProductKey(row.name);
    const match = clusters.find((cluster) => similarityOfKeys(cluster.key, key) >= threshold);

    if (match) {
      match.count += row.count;
      continue;
    }

    clusters.push({ key, name: row.name, count: row.count });
  }

  return clusters
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, 'es'))
    .map(({ name, count }) => ({ name, count }));
}
