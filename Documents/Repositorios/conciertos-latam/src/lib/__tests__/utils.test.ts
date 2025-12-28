import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn (classNames utility)', () => {
  it('combina clases simples', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('maneja clases condicionales', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
  });

  it('maneja objetos de clases', () => {
    expect(cn({ active: true, disabled: false })).toBe('active');
  });

  it('maneja arrays de clases', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2');
  });

  it('fusiona clases de Tailwind conflictivas', () => {
    // tailwind-merge should keep only the last conflicting class
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('mantiene clases de Tailwind no conflictivas', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4');
  });

  it('maneja valores undefined y null', () => {
    expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2');
  });

  it('maneja strings vacíos', () => {
    expect(cn('class1', '', 'class2')).toBe('class1 class2');
  });

  it('retorna string vacío sin argumentos', () => {
    expect(cn()).toBe('');
  });

  it('combina todas las variantes', () => {
    const result = cn(
      'base-class',
      true && 'conditional',
      false && 'not-included',
      { included: true, excluded: false },
      ['array-class'],
      undefined,
      'final-class'
    );
    expect(result).toContain('base-class');
    expect(result).toContain('conditional');
    expect(result).toContain('included');
    expect(result).toContain('array-class');
    expect(result).toContain('final-class');
    expect(result).not.toContain('not-included');
    expect(result).not.toContain('excluded');
  });
});
