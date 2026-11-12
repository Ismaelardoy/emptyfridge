import { MAX_INVITE_CODE_LENGTH, MIN_INVITE_CODE_LENGTH } from '@emptyfridge/contracts';

/** Alfabeto de códigos sin caracteres ambiguos (0, O, 1, I, L). */
const ALPHABET_SIZE = 32;

/**
 * No esperamos a llenar el espacio: a partir de 1/10.000 de ocupación
 * alargamos un carácter. Así el riesgo de colisión se mantiene bajo y los
 * códigos siguen siendo cortos de leer durante toda la vida útil del producto.
 */
const SAFETY_FACTOR = 10_000;

/**
 * Longitud del código de invitación según cuántos hogares existen.
 * Empieza en 6 y crece de uno en uno: 107.374 hogares → 7,
 * 3,4 millones → 8, y así hasta 12.
 */
export function inviteCodeLengthFor(households: number): number {
  let length = MIN_INVITE_CODE_LENGTH;

  while (
    length < MAX_INVITE_CODE_LENGTH &&
    households >= Math.floor(ALPHABET_SIZE ** length / SAFETY_FACTOR)
  ) {
    length += 1;
  }

  return length;
}
