/**
 * Timezone Utilities
 * 
 * Centralizes all date/time formatting with Bogota, Colombia timezone (America/Bogota)
 */

import { format as dateFnsFormat, parseISO } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';

// Bogota, Colombia timezone
export const BOGOTA_TIMEZONE = 'America/Bogota';

/**
 * Convert a UTC date to Bogota timezone
 */
export function toBogotaTime(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(dateObj, BOGOTA_TIMEZONE);
}

/**
 * Format a date in Bogota timezone with Spanish locale
 */
export function formatInBogota(
  date: Date | string,
  formatStr: string = 'PPP'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, BOGOTA_TIMEZONE, formatStr, { locale: es });
}

/**
 * Format date for display (e.g., "14 de diciembre de 2025")
 */
export function formatDisplayDate(date: Date | string): string {
  return formatInBogota(date, "d 'de' MMMM 'de' yyyy");
}

/**
 * Format date with time (e.g., "14 de diciembre de 2025, 8:00 PM")
 */
export function formatDisplayDateTime(date: Date | string): string {
  return formatInBogota(date, "d 'de' MMMM 'de' yyyy, h:mm a");
}

/**
 * Format short date (e.g., "14 dic 2025")
 */
export function formatShortDate(date: Date | string): string {
  return formatInBogota(date, 'd MMM yyyy');
}

/**
 * Format date for cards (e.g., "Dic 14, 2025")
 */
export function formatCardDate(date: Date | string): string {
  return formatInBogota(date, 'MMM d, yyyy');
}

/**
 * Format time only (e.g., "8:00 PM")
 */
export function formatTime(date: Date | string): string {
  return formatInBogota(date, 'h:mm a');
}

/**
 * Format relative date for news/blog (e.g., "hace 2 horas")
 */
export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const bogotaDate = toBogotaTime(dateObj);
  const now = toBogotaTime(new Date());
  
  const diffMs = now.getTime() - bogotaDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'hace un momento';
  if (diffMins < 60) return `hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
  if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  if (diffDays < 7) return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
  
  return formatDisplayDate(date);
}

/**
 * Check if a date is in the past (Bogota timezone)
 */
export function isPastDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const bogotaDate = toBogotaTime(dateObj);
  const now = toBogotaTime(new Date());
  return bogotaDate < now;
}

/**
 * Check if a date is today (Bogota timezone)
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const bogotaDate = toBogotaTime(dateObj);
  const now = toBogotaTime(new Date());
  
  return (
    bogotaDate.getFullYear() === now.getFullYear() &&
    bogotaDate.getMonth() === now.getMonth() &&
    bogotaDate.getDate() === now.getDate()
  );
}
