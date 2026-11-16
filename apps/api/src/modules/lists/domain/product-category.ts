import type { ProductCategory } from '@emptyfridge/contracts';
import { normalizeItemName } from './normalize-item-name';

type KnownCategory = Exclude<ProductCategory, 'otros'>;

interface CategoryKeywords {
  category: KnownCategory;
  words: readonly string[];
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
 * Singulariza sin diccionario. Para clasificar no hace falta acertar siempre:
 * con generar la variante sin plural basta para que "huevos" encuentre "huevo".
 */
function tokenVariants(token: string): Set<string> {
  const variants = new Set<string>([token]);
  if (token.length <= 3) {
    return variants;
  }

  if (token.endsWith('ces') && token.length > 4) {
    variants.add(`${token.slice(0, -3)}z`);
  }
  if (token.endsWith('es') && token.length > 4) {
    variants.add(token.slice(0, -2));
  }
  if (token.endsWith('s')) {
    variants.add(token.slice(0, -1));
  }

  return variants;
}

const NO_MATCH = 0;
const FUZZY_MATCH = 1;
const EXACT_MATCH = 2;

/**
 * ¿Están a una sola errata? Vale cambiar, sobrar, faltar o intercambiar dos
 * letras contiguas. Solo desde 4 letras: en "pan", "sal" o "te" una letra de
 * diferencia ya es otro producto.
 */
function isOneEditAway(left: string, right: string): boolean {
  if (left === right) {
    return true;
  }
  if (Math.min(left.length, right.length) < 4) {
    return false;
  }
  if (Math.abs(left.length - right.length) > 1) {
    return false;
  }

  if (left.length === right.length) {
    let first = -1;
    let second = -1;

    for (let index = 0; index < left.length; index += 1) {
      if (left[index] === right[index]) {
        continue;
      }
      if (first === -1) {
        first = index;
      } else if (second === -1) {
        second = index;
      } else {
        return false;
      }
    }

    if (second === -1) {
      // Cambiar una letra en una palabra de 4 letras confunde demasiado
      // ("cosa" con "coca"); a partir de 5 ya es una errata razonable.
      return first !== -1 && left.length >= 5;
    }

    // Dos letras contiguas intercambiadas: "leceh" -> "leche".
    return second === first + 1 && left[first] === right[second] && left[second] === right[first];
  }

  const shorter = left.length < right.length ? left : right;
  const longer = left.length < right.length ? right : left;
  let shortIndex = 0;
  let longIndex = 0;
  let skipped = false;

  while (shortIndex < shorter.length && longIndex < longer.length) {
    if (shorter[shortIndex] === longer[longIndex]) {
      shortIndex += 1;
      longIndex += 1;
      continue;
    }
    if (skipped) {
      return false;
    }
    skipped = true;
    longIndex += 1;
  }

  return true;
}

interface TokenInfo {
  value: string;
  variants: Set<string>;
}

function makeTokenInfo(token: string): TokenInfo {
  return { value: token, variants: tokenVariants(token) };
}

/**
 * 2 = exacta (o solo cambia el plural), 1 = una errata, 0 = no coincide.
 * La exactitud se usa después para desempatar: "polo" no debe caer en "pollo".
 */
function tokenMatchQuality(left: TokenInfo, right: TokenInfo): number {
  if (left.value === right.value) {
    return EXACT_MATCH;
  }

  for (const variant of left.variants) {
    if (right.variants.has(variant)) {
      return EXACT_MATCH;
    }
  }

  for (const variant of left.variants) {
    for (const other of right.variants) {
      if (isOneEditAway(variant, other)) {
        return FUZZY_MATCH;
      }
    }
  }

  return NO_MATCH;
}

/** Palabras útiles del nombre, sin tildes, puntuación ni palabras vacías. */
function significantTokens(value: string): string[] {
  return normalizeItemName(value)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((token) => token.length > 0 && !STOP_WORDS.has(token));
}

/**
 * Las frases valen más que las palabras sueltas: "tomate frito" es despensa
 * aunque "tomate" sea fruta, y "pasta de dientes" es higiene aunque "pasta"
 * sea despensa. Entre frases igual de largas, gana la que tenga más palabras
 * exactas; así una errata no adelanta a una coincidencia limpia.
 */
function baseScore(tokens: readonly string[]): number {
  return tokens.length * 10_000 + tokens.join(' ').length;
}

/**
 * Diccionario por secciones. El orden importa solo para desempatar: gana la
 * primera sección de la lista. Los términos están normalizados sin tildes.
 */
const CATEGORY_KEYWORDS: readonly CategoryKeywords[] = [
  {
    category: 'frutas-verduras',
    words: [
      'fruta',
      'verdura',
      'hortaliza',
      'vegetal',
      'ensalada',
      'manzana',
      'platano',
      'banana',
      'naranja',
      'mandarina',
      'limon',
      'lima',
      'pomelo',
      'fresa',
      'frambuesa',
      'arandano',
      'mora',
      'grosella',
      'cereza',
      'picota',
      'uva',
      'melon',
      'sandia',
      'pina',
      'kiwi',
      'mango',
      'papaya',
      'aguacate',
      'coco',
      'melocoton',
      'nectarina',
      'albaricoque',
      'ciruela',
      'pera',
      'higo',
      'granada',
      'caqui',
      'chirimoya',
      'paraguayo',
      'tomate',
      'cebolla',
      'ajo',
      'puerro',
      'zanahoria',
      'patata',
      'boniato',
      'calabacin',
      'calabaza',
      'berenjena',
      'pepino',
      'pimiento',
      'guindilla',
      'chile',
      'lechuga',
      'escarola',
      'endivia',
      'espinaca',
      'acelga',
      'repollo',
      'lombarda',
      'brocoli',
      'coliflor',
      'romanesco',
      'col',
      'judia verde',
      'guisante',
      'haba',
      'alcachofa',
      'esparrago',
      'apio',
      'rabano',
      'remolacha',
      'nabo',
      'brote',
      'seta',
      'champinon',
      'hongo',
      'perejil',
      'cilantro',
      'albahaca',
      'menta',
      'hierbabuena',
      'romero',
      'tomillo',
      'laurel',
      'eneldo',
      'hinojo',
      'jengibre',
      'mazorca',
      'brote de soja',
    ],
  },
  {
    category: 'panaderia',
    words: [
      'pan',
      'baguette',
      'bagueta',
      'barra de pan',
      'pan de molde',
      'pan integral',
      'panecillo',
      'hogaza',
      'chapata',
      'pita',
      'naan',
      'brioche',
      'pan de hamburguesa',
      'pan de perrito',
      'bollo',
      'croissant',
      'cruasan',
      'napolitana',
      'ensaimada',
      'magdalena',
      'bizcocho',
      'donut',
      'dona',
      'berlinesa',
      'tortita',
      'pancake',
      'crepe',
      'gofre',
      'empanada',
      'tarta',
      'pastel',
      'tarta de queso',
      'tarta de cumpleanos',
    ],
  },
  {
    category: 'carniceria',
    words: [
      'carne',
      'carniceria',
      'pollo',
      'pollo asado',
      'pechuga',
      'muslo',
      'contramuslo',
      'alita',
      'ternera',
      'vaca',
      'buey',
      'cerdo',
      'cochinillo',
      'cordero',
      'conejo',
      'pavo',
      'pato',
      'gallina',
      'codorniz',
      'perdiz',
      'filete',
      'chuleta',
      'costilla',
      'solomillo',
      'entrecot',
      'lomo',
      'redondo',
      'aguja',
      'falda',
      'morcillo',
      'carrillera',
      'rabo',
      'osobuco',
      'higado',
      'rinon',
      'molleja',
      'lengua',
      'hamburguesa',
      'albondiga',
      'pincho',
      'brocheta',
      'kebab',
      'asado',
      'carne picada',
      'picadillo',
      'panceta fresca',
      'salchicha fresca',
      'chorizo fresco',
      'butifarra fresca',
    ],
  },
  {
    category: 'pescaderia',
    words: [
      'pescado',
      'pescaderia',
      'merluza',
      'salmon',
      'trucha',
      'dorada',
      'lubina',
      'rape',
      'rodaballo',
      'lenguado',
      'bacalao',
      'abadejo',
      'halibut',
      'emperador',
      'atun fresco',
      'lomo de atun',
      'rodaja de atun',
      'bonito',
      'caballa',
      'jurel',
      'boqueron',
      'sardina fresca',
      'anchoa fresca',
      'pez espada',
      'cazon',
      'tintorera',
      'gamba',
      'langostino',
      'marisco',
      'mejillon',
      'almeja',
      'berberecho',
      'navaja',
      'ostra',
      'vieira',
      'calamar',
      'pulpo',
      'sepia',
      'chipiron',
      'poton',
      'cangrejo',
      'centollo',
      'buey de mar',
      'langosta',
      'bogavante',
      'camaron',
      'gula',
      'surimi',
      'palito de cangrejo',
    ],
  },
  {
    category: 'charcuteria',
    words: [
      'charcuteria',
      'jamon',
      'jamon serrano',
      'jamon iberico',
      'jamon cocido',
      'paleta',
      'prosciutto',
      'cecina',
      'lacon',
      'chorizo',
      'salchichon',
      'mortadela',
      'salami',
      'fuet',
      'sobrasada',
      'bacon',
      'beicon',
      'panceta',
      'lomo embuchado',
      'lomo curado',
      'pate',
      'foie',
      'fiambre',
      'embutido',
      'morcilla',
      'salchicha',
      'butifarra',
      'frankfurt',
      'wurstel',
      'bratwurst',
      'loncha de pavo',
      'loncha de pollo',
      'pavo en lonchas',
      'taquito de jamon',
      'jamoncito',
      'queso de cabeza',
    ],
  },
  {
    category: 'lacteos-huevos',
    words: [
      'lacteo',
      'leche',
      'leche entera',
      'leche semidesnatada',
      'leche desnatada',
      'leche de avena',
      'leche de soja',
      'leche de almendra',
      'leche de arroz',
      'leche de coco',
      'bebida vegetal',
      'yogur',
      'yogurt',
      'yogur griego',
      'kefir',
      'cuajada',
      'requeson',
      'queso',
      'queso fresco',
      'queso curado',
      'queso rallado',
      'queso en lonchas',
      'queso crema',
      'queso de cabra',
      'queso azul',
      'mantequilla',
      'margarina',
      'nata',
      'crema',
      'crema agria',
      'crema fresca',
      'crema de leche',
      'huevo',
      'huevos',
      'clara de huevo',
      'yema de huevo',
      'batido',
    ],
  },
  {
    category: 'despensa',
    words: [
      'despensa',
      'pasta',
      'macarron',
      'espagueti',
      'spaghetti',
      'tallarin',
      'fideo',
      'lasana',
      'ravioli',
      'tortellini',
      'noodle',
      'arroz',
      'arroz bomba',
      'arroz basmati',
      'arroz integral',
      'quinoa',
      'cuscus',
      'bulgur',
      'legumbre',
      'lenteja',
      'garbanzo',
      'alubia',
      'judion',
      'soja',
      'guisante seco',
      'guisante en lata',
      'aceite',
      'aceite de oliva',
      'aceite de girasol',
      'aceite de coco',
      'vinagre',
      'vinagre balsamico',
      'sal',
      'sal marina',
      'sal gruesa',
      'azucar',
      'azucar moreno',
      'azucar glas',
      'edulcorante',
      'sacarina',
      'harina',
      'maicena',
      'levadura',
      'bicarbonato',
      'especia',
      'pimienta',
      'oregano',
      'comino',
      'canela',
      'curry',
      'paprika',
      'pimenton',
      'nuez moscada',
      'azafran',
      'jengibre molido',
      'cafe',
      'cafe molido',
      'cafe en grano',
      'cafe soluble',
      'descafeinado',
      'cafe con leche',
      'te',
      'infusion',
      'manzanilla',
      'poleo',
      'cacao',
      'colacao',
      'nescafe',
      'nesquik',
      'chocolate',
      'chocolate a la taza',
      'cereal',
      'avena',
      'muesli',
      'granola',
      'copos de avena',
      'corn flakes',
      'galleta',
      'cookie',
      'snack',
      'aperitivo',
      'patatas fritas',
      'chips',
      'palomitas',
      'frutos secos',
      'almendra',
      'avellana',
      'pistacho',
      'anacardo',
      'cacahuete',
      'nuez',
      'pasa',
      'orejon',
      'datil',
      'higo seco',
      'salsa',
      'mayonesa',
      'ketchup',
      'mostaza',
      'alioli',
      'salsa barbacoa',
      'salsa de soja',
      'tomate frito',
      'tomate triturado',
      'tomate pelado',
      'tomate seco',
      'pimiento piquillo',
      'pimiento asado',
      'sofrito',
      'caldo',
      'sopa',
      'pure',
      'pure de patata',
      'miel',
      'mermelada',
      'confitura',
      'crema de cacahuete',
      'crema de avellana',
      'mantequilla de cacahuete',
      'nocilla',
      'nutella',
      'hummus',
      'guacamole',
      'conserva',
      'lata de atun',
      'atun',
      'atun en lata',
      'sardina',
      'anchoa',
      'caballa en lata',
      'bonito del norte en lata',
      'mejillones en escabeche',
      'aceituna',
      'pepinillo',
      'alcaparra',
      'cebollita',
      'banderilla',
      'maiz',
      'maiz dulce',
      'leche condensada',
      'leche evaporada',
      'leche en polvo',
      'gelatina',
      'flan',
      'natilla',
      'pan rallado',
      'tortita de maiz',
      'tortilla de maiz',
      'nachos',
    ],
  },
  {
    category: 'congelados',
    words: [
      'congelado',
      'congelada',
      'ultracongelado',
      'ultracongelada',
      'pizza',
      'pizza congelada',
      'helado',
      'polo',
      'hielo',
      'cubito de hielo',
      'nugget',
      'nuggets de pollo',
      'croqueta',
      'san jacobo',
      'varita de pescado',
      'palito de pescado',
      'empanadilla',
      'empanadilla congelada',
      'empanada congelada',
      'verdura congelada',
      'verduras congeladas',
      'patata congelada',
      'patatas congeladas',
      'patatas fritas congeladas',
      'guisante congelado',
      'guisantes congelados',
      'judia congelada',
      'judias congeladas',
      'brocoli congelado',
      'espinaca congelada',
      'espinacas congeladas',
      'menestra',
      'salteado de verduras',
      'pescado congelado',
      'gamba congelada',
      'langostino congelado',
      'marisco congelado',
      'calamar congelado',
      'pulpo congelado',
      'albondiga congelada',
      'albondigas congeladas',
      'hamburguesa congelada',
      'pollo congelado',
      'carne congelada',
      'tarta congelada',
      'tarta de helado',
    ],
  },
  {
    category: 'bebidas',
    words: [
      'bebida',
      'refresco',
      'agua',
      'agua mineral',
      'agua con gas',
      'agua sin gas',
      'agua de coco',
      'agua tonica',
      'tonica',
      'cerveza',
      'cerveza sin alcohol',
      'vino',
      'vino tinto',
      'vino blanco',
      'vino rosado',
      'cava',
      'champan',
      'sidra',
      'vermut',
      'zumo',
      'jugo',
      'zumo de naranja',
      'zumo de manzana',
      'mosto',
      'coca cola',
      'cocacola',
      'coca',
      'coca zero',
      'fanta',
      'sprite',
      'seven up',
      'pepsi',
      'aquarius',
      'powerade',
      'gatorade',
      'bebida isotonica',
      'bebida energetica',
      'red bull',
      'monster',
      'whisky',
      'ginebra',
      'ron',
      'vodka',
      'licor',
      'tequila',
      'brandy',
      'conac',
      'cointreau',
      'baileys',
      'horchata',
      'smoothie',
      'kombucha',
      'pina colada',
    ],
  },
  {
    category: 'limpieza-hogar',
    words: [
      'limpieza',
      'producto de limpieza',
      'detergente',
      'detergente liquido',
      'detergente en polvo',
      'pastilla lavadora',
      'pastillas lavadora',
      'pastilla lavavajillas',
      'pastillas lavavajillas',
      'suavizante',
      'lejia',
      'lavavajillas',
      'friegasuelos',
      'limpiador',
      'limpiacristales',
      'limpia cristales',
      'desinfectante',
      'desengrasante',
      'quitamanchas',
      'quitagrasas',
      'antical',
      'abrillantador',
      'sal de lavavajillas',
      'sal lavavajillas',
      'bayeta',
      'estropajo',
      'esponja',
      'fregona',
      'escoba',
      'recogedor',
      'cubo',
      'guante de limpieza',
      'guantes de limpieza',
      'guantes de latex',
      'bolsa de basura',
      'bolsas de basura',
      'papel de cocina',
      'servilleta',
      'film transparente',
      'papel film',
      'papel aluminio',
      'aluminio',
      'papel de horno',
      'bolsa de congelacion',
      'pilas',
      'bombilla',
      'vela',
      'cerilla',
      'mechero',
      'ambientador',
      'insecticida',
      'matamoscas',
      'trampa para ratones',
      'bolsa de aspiradora',
      'vinagre de limpieza',
      'amoniaco',
      'sosa caustica',
    ],
  },
  {
    category: 'higiene-cuidado',
    words: [
      'higiene',
      'cuidado personal',
      'aseo',
      'perfumeria',
      'champu',
      'champoo',
      'gel',
      'gel de bano',
      'gel de ducha',
      'jabon',
      'jabon de manos',
      'jabon corporal',
      'pasta de dientes',
      'dentifrico',
      'cepillo de dientes',
      'cepillo',
      'enjuague bucal',
      'hilo dental',
      'seda dental',
      'desodorante',
      'antitranspirante',
      'colonia',
      'perfume',
      'after shave',
      'locion',
      'papel higienico',
      'papel higienico humedo',
      'compresa',
      'tampon',
      'salvaslip',
      'protegeslip',
      'copa menstrual',
      'maquinilla',
      'cuchilla',
      'afeitado',
      'espuma de afeitar',
      'gel de afeitar',
      'crema de afeitar',
      'crema hidratante',
      'crema facial',
      'crema corporal',
      'crema de manos',
      'crema solar',
      'protector solar',
      'after sun',
      'bronceador',
      'algodon',
      'bastoncillo',
      'toallita facial',
      'toallita limpiadora',
      'lubricante',
      'preservativo',
      'condon',
      'cepillo de pelo',
      'peine',
      'goma de pelo',
      'maquillaje',
      'pintalabios',
      'rimel',
      'base de maquillaje',
      'colorete',
      'mascara de pestanas',
      'esmalte',
      'quitaesmalte',
      'laca de unas',
      'agua oxigenada',
      'mascarilla',
    ],
  },
  {
    category: 'bebes',
    words: [
      'bebe',
      'panal',
      'panales',
      'toallita',
      'toallitas',
      'toallita humeda',
      'toallitas humedas',
      'potito',
      'potitos',
      'papilla',
      'papillas',
      'cereal bebe',
      'cereal infantil',
      'cerelac',
      'biberon',
      'tetina',
      'chupete',
      'mordedor',
      'babero',
      'leche formula',
      'leche de formula',
      'leche maternizada',
      'leche infantil',
      'leche de crecimiento',
      'formula bebe',
      'crema para el culito',
      'crema del culito',
      'crema para panales',
      'pomada panal',
      'comida bebe',
      'agua bebe',
      'empapador bebe',
    ],
  },
  {
    category: 'mascotas',
    words: [
      'mascota',
      'perro',
      'gato',
      'arena',
      'pienso',
      'pienso para perros',
      'pienso para gatos',
      'comida de perro',
      'comida de gato',
      'comida perro',
      'comida gato',
      'lata de perro',
      'lata de gato',
      'sobre de perro',
      'sobre de gato',
      'snack de perro',
      'snack de gato',
      'galleta para perro',
      'galleta para gato',
      'arena de gato',
      'arena para gatos',
      'arena gato',
      'lecho de gato',
      'empapador perro',
      'empapador para perros',
      'antipulgas',
      'collar antipulgas',
      'pulguero',
      'desparasitante',
      'desparasitante perro',
      'desparasitante gato',
      'juguete de perro',
      'juguete de gato',
      'rascador',
      'transportin',
      'hueso de perro',
    ],
  },
];

const KEYWORD_ENTRIES: readonly {
  category: KnownCategory;
  tokens: readonly TokenInfo[];
  score: number;
}[] = CATEGORY_KEYWORDS.flatMap(({ category, words }) =>
  words.map((word) => {
    const tokens = significantTokens(word);
    return {
      category,
      tokens: tokens.map(makeTokenInfo),
      score: baseScore(tokens),
    };
  }),
);

interface PhraseMatch {
  exactTokens: number;
}

function matchPhrase(
  nameTokens: readonly TokenInfo[],
  keywordTokens: readonly TokenInfo[],
): PhraseMatch | null {
  if (keywordTokens.length === 0) {
    return null;
  }

  if (keywordTokens.length === 1) {
    const keyword = keywordTokens[0];
    if (!keyword) {
      return null;
    }

    let best = NO_MATCH;
    for (const token of nameTokens) {
      best = Math.max(best, tokenMatchQuality(token, keyword));
    }

    return best === NO_MATCH ? null : { exactTokens: best === EXACT_MATCH ? 1 : 0 };
  }

  let bestExact = -1;

  for (let start = 0; start + keywordTokens.length <= nameTokens.length; start += 1) {
    let exact = 0;
    let matches = true;

    for (let offset = 0; offset < keywordTokens.length; offset += 1) {
      const nameToken = nameTokens[start + offset];
      const keywordToken = keywordTokens[offset];
      if (!nameToken || !keywordToken) {
        matches = false;
        break;
      }

      const quality = tokenMatchQuality(nameToken, keywordToken);
      if (quality === NO_MATCH) {
        matches = false;
        break;
      }
      if (quality === EXACT_MATCH) {
        exact += 1;
      }
    }

    if (matches && exact > bestExact) {
      bestExact = exact;
    }
  }

  return bestExact < 0 ? null : { exactTokens: bestExact };
}

// La lista se sondea cada 3 s y repite los mismos nombres. Una caché pequeña
// evita recorrer el diccionario entero en cada respuesta.
const CATEGORY_CACHE_LIMIT = 1_000;
const CATEGORY_CACHE = new Map<string, ProductCategory>();

function rememberCategory(key: string, category: ProductCategory): ProductCategory {
  if (CATEGORY_CACHE.size >= CATEGORY_CACHE_LIMIT) {
    CATEGORY_CACHE.clear();
  }
  CATEGORY_CACHE.set(key, category);
  return category;
}

/** Devuelve la sección del supermercado para un nombre de producto. */
export function categorizeProduct(name: string): ProductCategory {
  const cacheKey = normalizeItemName(name);
  const cached = CATEGORY_CACHE.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const nameTokens = significantTokens(name).map(makeTokenInfo);
  if (nameTokens.length === 0) {
    return rememberCategory(cacheKey, 'otros');
  }

  let best: { category: KnownCategory; score: number } | null = null;

  for (const entry of KEYWORD_ENTRIES) {
    const match = matchPhrase(nameTokens, entry.tokens);
    if (!match) {
      continue;
    }

    const score = entry.score + match.exactTokens * 100;
    if (best === null || score > best.score) {
      best = { category: entry.category, score };
    }
  }

  return rememberCategory(cacheKey, best?.category ?? 'otros');
}
