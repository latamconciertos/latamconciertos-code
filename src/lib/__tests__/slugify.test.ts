import { describe, it, expect } from 'vitest';
import { slugify, isValidSlug } from '../slugify';

describe('slugify', () => {
  it('convierte texto simple a slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('convierte a minúsculas', () => {
    expect(slugify('HELLO WORLD')).toBe('hello-world');
  });

  it('elimina acentos', () => {
    expect(slugify('Café con leche')).toBe('cafe-con-leche');
    expect(slugify('Dúa Lípá')).toBe('dua-lipa');
  });

  it('reemplaza ñ por n', () => {
    expect(slugify('Año Nuevo')).toBe('ano-nuevo');
    expect(slugify('España')).toBe('espana');
  });

  it('elimina caracteres especiales', () => {
    expect(slugify('Hello! World?')).toBe('hello-world');
    expect(slugify('Test@#$%^&*()')).toBe('test');
  });

  it('elimina espacios al inicio y final', () => {
    expect(slugify('  Hello World  ')).toBe('hello-world');
  });

  it('reemplaza múltiples espacios por un solo guión', () => {
    expect(slugify('Hello    World')).toBe('hello-world');
  });

  it('elimina guiones duplicados', () => {
    expect(slugify('Hello - - World')).toBe('hello-world');
  });

  it('maneja strings vacíos', () => {
    expect(slugify('')).toBe('');
  });

  it('maneja números', () => {
    expect(slugify('Tour 2024')).toBe('tour-2024');
  });

  it('maneja caracteres unicode complejos', () => {
    expect(slugify('Björk Guðmundsdóttir')).toBe('bjork-gudmundsdottir');
  });

  it('convierte nombres de artistas latinos correctamente', () => {
    expect(slugify('Bad Bunny')).toBe('bad-bunny');
    expect(slugify('J Balvin')).toBe('j-balvin');
    expect(slugify('Rauw Alejandro')).toBe('rauw-alejandro');
  });
});

describe('isValidSlug', () => {
  it('valida slugs correctos', () => {
    expect(isValidSlug('hello-world')).toBe(true);
    expect(isValidSlug('test123')).toBe(true);
    expect(isValidSlug('a-b-c-1-2-3')).toBe(true);
  });

  it('rechaza slugs con mayúsculas', () => {
    expect(isValidSlug('Hello-World')).toBe(false);
  });

  it('rechaza slugs con espacios', () => {
    expect(isValidSlug('hello world')).toBe(false);
  });

  it('rechaza slugs con caracteres especiales', () => {
    expect(isValidSlug('hello_world')).toBe(false);
    expect(isValidSlug('hello@world')).toBe(false);
  });

  it('rechaza strings vacíos', () => {
    expect(isValidSlug('')).toBe(false);
  });

  it('valida slugs con solo números', () => {
    expect(isValidSlug('123')).toBe(true);
  });
});
