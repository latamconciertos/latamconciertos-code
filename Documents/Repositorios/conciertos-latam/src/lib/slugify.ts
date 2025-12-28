/**
 * Convierte texto a un slug válido para URLs
 * - Normaliza caracteres acentuados (á -> a, ñ -> n)
 * - Convierte a minúsculas
 * - Elimina caracteres especiales
 * - Reemplaza espacios con guiones
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Eliminar marcas diacríticas
    .replace(/ñ/g, 'n') // Reemplazar ñ específicamente
    .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
    .trim()
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-'); // Eliminar guiones duplicados
};

/**
 * Valida que un slug tenga el formato correcto
 * Solo debe contener letras minúsculas, números y guiones
 */
export const isValidSlug = (slug: string): boolean => {
  return /^[a-z0-9-]+$/.test(slug);
};
