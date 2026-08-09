/**
 * Países de la ingesta: código ISO → nombre y bandera.
 * La bandera es contenido (identifica el país), no iconografía decorativa.
 */
export const COUNTRY_LABELS: Record<string, { name: string; flag: string }> = {
  CO: { name: 'Colombia', flag: '\u{1F1E8}\u{1F1F4}' },
  MX: { name: 'México', flag: '\u{1F1F2}\u{1F1FD}' },
  AR: { name: 'Argentina', flag: '\u{1F1E6}\u{1F1F7}' },
  CL: { name: 'Chile', flag: '\u{1F1E8}\u{1F1F1}' },
  PE: { name: 'Perú', flag: '\u{1F1F5}\u{1F1EA}' },
  BR: { name: 'Brasil', flag: '\u{1F1E7}\u{1F1F7}' },
  EC: { name: 'Ecuador', flag: '\u{1F1EA}\u{1F1E8}' },
  UY: { name: 'Uruguay', flag: '\u{1F1FA}\u{1F1FE}' },
  PY: { name: 'Paraguay', flag: '\u{1F1F5}\u{1F1FE}' },
  BO: { name: 'Bolivia', flag: '\u{1F1E7}\u{1F1F4}' },
  VE: { name: 'Venezuela', flag: '\u{1F1FB}\u{1F1EA}' },
  CR: { name: 'Costa Rica', flag: '\u{1F1E8}\u{1F1F7}' },
  PA: { name: 'Panamá', flag: '\u{1F1F5}\u{1F1E6}' },
  GT: { name: 'Guatemala', flag: '\u{1F1EC}\u{1F1F9}' },
  DO: { name: 'Rep. Dominicana', flag: '\u{1F1E9}\u{1F1F4}' },
  PR: { name: 'Puerto Rico', flag: '\u{1F1F5}\u{1F1F7}' },
};

export function countryLabel(code: string): string {
  const entry = COUNTRY_LABELS[code];
  return entry ? `${entry.flag} ${entry.name}` : code;
}
