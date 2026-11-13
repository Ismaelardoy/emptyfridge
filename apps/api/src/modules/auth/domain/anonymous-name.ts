import { randomInt } from 'node:crypto';

/**
 * Identidades anónimas con humor negro de nevera: comida olvidada, sobras
 * sospechosas y pequeños crímenes domésticos. Se elige una al azar y se le
 * añade un número para que sea única.
 */
const NAMES = [
  'LonchaDeBacon',
  'BrikDeLeche',
  'CacaoVacío',
  'TostadoraAsesina',
  'ElQueNoLavaLosPlatos',
  'ComeYNoPaga',
  'ReyDelGazpacho',
  'SeñorDeLaNevera',
  'AceitunaBrava',
  'DoñaPescaíto',
  'ElQueApagaLaLuz',
  'YogurCaducado',
  'SobrasDelDomingo',
  'FideoPegado',
  'ElDelTupperAjeno',
  'CroquetaFugitiva',
  'PanDuro',
  'CaducadoAyer',
  'ElQueSeComeTuPostre',
  'MantequillaRancia',
  'HuevoRoto',
  'PechugaCongelada',
  'ElLavavajillasHumano',
  'ChorizoOlvidado',
  'ElQueNoReponeElPapel',
  'BoteDeMayonesa',
  'GambaPasada',
  'MortadelaTriste',
  'SalchichaSospechosa',
  'CebollaEnElFondo',
  'ElFantasmaDelFrigo',
  'RestosDelGuiso',
  'ElQueNoTiraLaBasura',
  'YogurDelMesPasado',
  'ElUltimoChorizo',
  'SobrasConPelusilla',
  'QuesoCaducado',
  'ElQueChupaLaCuchara',
  'AtunDelAñoPasado',
  'PescadoDeMartes',
  'ElDelFondoDelFrigo',
  'MorcillaTraicionera',
] as const;

/** Nombre anónimo y gracioso para no pedir registro. */
export function randomAnonymousName(): string {
  const name = NAMES[randomInt(NAMES.length)] ?? 'Invitado';
  return `${name} ${randomInt(1000, 10_000)}`;
}
