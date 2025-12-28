/**
 * Error System - Exports centralizados
 * 
 * Sistema de manejo de errores tipado y consistente.
 * 
 * @example
 * ```ts
 * import { handleError, AppError, ErrorCode } from '@/lib/errors';
 * 
 * try {
 *   await someOperation();
 * } catch (error) {
 *   const appError = handleError(error, { operation: 'myOperation' });
 *   if (appError.code === ErrorCode.AUTH_REQUIRED) {
 *     // Redirect to login
 *   }
 * }
 * ```
 */

// Error class
export { AppError, type AppErrorOptions } from './AppError';

// Error codes and types
export { 
  ErrorCode, 
  type ErrorCodeType, 
  type ErrorSeverity,
  ERROR_SEVERITY_MAP,
  ERROR_STATUS_MAP,
} from './errorCodes';

// Error messages
export { 
  ERROR_MESSAGES, 
  getErrorMessage,
  type ErrorMessage,
} from './errorMessages';

// Supabase error mapping
export { 
  mapSupabaseError,
  type SupabaseErrorLike,
  type MappedError,
} from './supabaseErrors';

// Error handler
export { 
  handleError, 
  normalizeError,
  createError,
  type HandleErrorOptions,
} from './errorHandler';
