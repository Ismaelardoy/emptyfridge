import { describe, expect, it } from 'vitest';
import { categorizeProduct } from './product-category';

describe('categorizeProduct', () => {
  it.each([
    ['Leche entera', 'lacteos-huevos'],
    ['Huevos camperos', 'lacteos-huevos'],
    ['Queso rallado', 'lacteos-huevos'],
    ['Manzanas', 'frutas-verduras'],
    ['Tomate', 'frutas-verduras'],
    ['Judía verde', 'frutas-verduras'],
    ['Pechuga de pollo', 'carniceria'],
    ['Salmón', 'pescaderia'],
    ['Jamón serrano', 'charcuteria'],
    ['Pan de molde', 'panaderia'],
    ['Pizza congelada', 'congelados'],
    ['Cerveza', 'bebidas'],
    ['Detergente', 'limpieza-hogar'],
    ['Pasta de dientes', 'higiene-cuidado'],
    ['Pañales', 'bebes'],
    ['Pienso para gatos', 'mascotas'],
    ['Bicicleta', 'otros'],
  ])('clasifica %s como %s', (name, category) => {
    expect(categorizeProduct(name)).toBe(category);
  });

  it('prioriza la frase más específica sobre la palabra suelta', () => {
    expect(categorizeProduct('Tomate frito')).toBe('despensa');
    expect(categorizeProduct('Leche de avena')).toBe('lacteos-huevos');
    expect(categorizeProduct('Leche en polvo')).toBe('despensa');
    expect(categorizeProduct('Atún fresco')).toBe('pescaderia');
    expect(categorizeProduct('Patatas fritas congeladas')).toBe('congelados');
    expect(categorizeProduct('Papel de cocina')).toBe('limpieza-hogar');
    expect(categorizeProduct('Agua oxigenada')).toBe('higiene-cuidado');
    expect(categorizeProduct('Sal de lavavajillas')).toBe('limpieza-hogar');
  });

  it('tolera una errata de una letra', () => {
    expect(categorizeProduct('Lece')).toBe('lacteos-huevos');
    expect(categorizeProduct('Lechee')).toBe('lacteos-huevos');
    expect(categorizeProduct('Cervesa')).toBe('bebidas');
    expect(categorizeProduct('Tomatee frito')).toBe('despensa');
    expect(categorizeProduct('Detergnete')).toBe('limpieza-hogar');
    expect(categorizeProduct('Huebo')).toBe('lacteos-huevos');
    expect(categorizeProduct('Atun')).toBe('despensa');
    expect(categorizeProduct('Atnu')).toBe('despensa');
  });

  it('la coincidencia exacta gana a una errata parecida', () => {
    expect(categorizeProduct('Polo')).toBe('congelados');
    expect(categorizeProduct('Pollo')).toBe('carniceria');
    expect(categorizeProduct('Pato')).toBe('carniceria');
    expect(categorizeProduct('Gato')).toBe('mascotas');
    expect(categorizeProduct('Avena')).toBe('despensa');
    expect(categorizeProduct('Arena')).toBe('mascotas');
    expect(categorizeProduct('Coco')).toBe('frutas-verduras');
    expect(categorizeProduct('Coca')).toBe('bebidas');
  });

  it('no tolera erratas en palabras demasiado cortas', () => {
    expect(categorizeProduct('Paz')).toBe('otros');
    expect(categorizeProduct('Sal')).toBe('despensa');
    expect(categorizeProduct('Pna')).toBe('otros');
  });

  it('no confunde palabras que solo comparten prefijo', () => {
    expect(categorizeProduct('Pantera')).toBe('otros');
    expect(categorizeProduct('Salsa')).toBe('despensa');
    expect(categorizeProduct('Salchichón')).toBe('charcuteria');
    expect(categorizeProduct('Pepino')).toBe('frutas-verduras');
    expect(categorizeProduct('Pepinillo')).toBe('despensa');
    expect(categorizeProduct('Gelatina')).toBe('despensa');
  });

  it('devuelve otros cuando el nombre está vacío o no se reconoce', () => {
    expect(categorizeProduct('')).toBe('otros');
    expect(categorizeProduct('   ')).toBe('otros');
    expect(categorizeProduct('Cosa rara')).toBe('otros');
  });
});
