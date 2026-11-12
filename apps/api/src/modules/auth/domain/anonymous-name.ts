import { randomInt } from 'node:crypto';

/**
 * Diez ejemplos de identidad anónima, todos con guasa.
 * Se elige uno al azar y se le añade un número para que sea único.
 */
const NAMES = [
  'TostadoraAsesina',
  'ElQueNoLavaLosPlatos',
  'ComeYNoPaga',
  'ReyDelGazpacho',
  'LaDelAbanico',
  'SeñorDeLaNevera',
  'AceitunaBrava',
  'ElQueApagaLaLuz',
  'DoñaPescaíto',
  'BuscadorDeOfertas',
] as const;

/** Nombre anónimo y gracioso para no pedir registro. */
export function randomAnonymousName(): string {
  const name = NAMES[randomInt(NAMES.length)] ?? 'Invitado';
  return `${name} ${randomInt(1000, 10_000)}`;
}
