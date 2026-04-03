/**
 * Error Handler - Procesador centralizado de errores
 * 
 * Normaliza, loguea y muestra errores de forma consistente.
 */

import { toast } from 'sonner';
import { AppError } from './AppError';
import { ErrorCode, type ErrorCodeType } from './errorCodes';
import { mapSupabaseError, type SupabaseErrorLike } from './supabaseErrors';

export interface HandleErrorOptions {
  /** Mostrar toast de error (default: true) */
  showToast?: boolean;
  /** Loguear en consola (default: true) */
  logToConsole?: boolean;
  /** Contexto adicional para debugging */
  context?: Record<string, unknown>;
  /** Mensaje personalizado para el toast */
  fallbackMessage?: string;
  /** Identificador de la operación para logs */
  operation?: string;
}

/**
 * Manejador centralizado de errores
 * 
 * @example
 * ```ts
 * try {
 *   await someOperation();
 * } catch (error) {
 *   handleError(error, { operation: 'saveUser', showToast: true });
 * }
 * ```
 */
export function handleError(
  error: unknown,
  options: HandleErrorOptions = {}
): AppError {
  const { 
    showToast = true, 
    logToConsole = true,
    context,
    fallbackMessage,
    operation,
  } = options;

  // Normalizar a AppError
  const appError = normalizeError(error, { ...context, operation });
  
  // Logging
  if (logToConsole) {
    const logData = appError.toJSON();
    
    if (appError.severity === 'critical') {
      console.error('[AppError:CRITICAL]', logData);
    } else if (appError.severity === 'error') {
      console.error('[AppError]', logData);
    } else {
      console.warn('[AppError]', logData);
    }
  }
  
  // Toast notification
  if (showToast) {
    showErrorToast(appError, fallbackMessage);
  }
  
  return appError;
}

/**
 * Muestra un toast apropiado según la severidad del error
 */
function showErrorToast(error: AppError, fallbackMessage?: string): void {
  const { title, description } = error.userMessage;
  const message = fallbackMessage || description;
  
  switch (error.severity) {
    case 'info':
      toast.info(title, { description: message });
      break;
    case 'warning':
      toast.warning(title, { description: message });
      break;
    case 'critical':
    case 'error':
    default:
      toast.error(title, { description: message });
  }
}

/**
 * Normaliza cualquier error a AppError
 */
export function normalizeError(
  error: unknown,
  context?: Record<string, unknown>
): AppError {
  // Ya es AppError
  if (error instanceof AppError) {
    return error;
  }
  
  // Error de Supabase
  if (isSupabaseError(error)) {
    const { code, message } = mapSupabaseError(error);
    return new AppError({
      code,
      message: message || error.message,
      context: { ...context, originalError: sanitizeError(error) },
      cause: error instanceof Error ? error : undefined,
    });
  }
  
  // Error de Zod (validación)
  if (isZodError(error)) {
    const firstError = error.errors[0];
    return new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: firstError?.message || 'Error de validación',
      context: { 
        ...context, 
        zodErrors: error.errors.map(e => ({
          path: e.path,
          message: e.message,
        })),
      },
    });
  }
  
  // Error nativo de JavaScript
  if (error instanceof Error) {
    const { code } = mapSupabaseError({ message: error.message });
    return new AppError({
      code,
      message: error.message,
      context,
      cause: error,
    });
  }
  
  // String de error
  if (typeof error === 'string') {
    const { code } = mapSupabaseError({ message: error });
    return new AppError({
      code,
      message: error,
      context,
    });
  }
  
  // Error completamente desconocido
  return new AppError({
    code: ErrorCode.UNKNOWN,
    message: 'Error desconocido',
    context: { ...context, originalError: error },
  });
}

/**
 * Type guard para errores de Supabase
 */
function isSupabaseError(error: unknown): error is SupabaseErrorLike {
  return (
    typeof error === 'object' && 
    error !== null && 
    'message' in error &&
    typeof (error as SupabaseErrorLike).message === 'string'
  );
}

/**
 * Type guard para errores de Zod
 */
interface ZodErrorLike {
  errors: Array<{ 
    path: (string | number)[];
    message: string;
    code?: string;
  }>;
  name?: string;
}

function isZodError(error: unknown): error is ZodErrorLike {
  return (
    typeof error === 'object' && 
    error !== null && 
    'errors' in error &&
    Array.isArray((error as ZodErrorLike).errors) &&
    (error as ZodErrorLike).errors.length > 0 &&
    'message' in (error as ZodErrorLike).errors[0]
  );
}

/**
 * Sanitiza un error para logging seguro (remueve datos sensibles)
 */
function sanitizeError(error: unknown): unknown {
  if (typeof error !== 'object' || error === null) {
    return error;
  }
  
  const sanitized = { ...error } as Record<string, unknown>;
  
  // Remover campos potencialmente sensibles
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Crea un error de tipo específico (factory functions)
 */
export const createError = {
  network: (message?: string) => new AppError({ 
    code: ErrorCode.NETWORK_ERROR, 
    message,
  }),
  
  authRequired: (message?: string) => new AppError({ 
    code: ErrorCode.AUTH_REQUIRED, 
    message,
  }),
  
  notFound: (resource?: string) => new AppError({ 
    code: ErrorCode.NOT_FOUND, 
    message: resource ? `${resource} no encontrado` : undefined,
  }),
  
  validation: (message: string, context?: Record<string, unknown>) => new AppError({ 
    code: ErrorCode.VALIDATION_ERROR, 
    message,
    context,
  }),
  
  forbidden: (message?: string) => new AppError({ 
    code: ErrorCode.AUTH_FORBIDDEN, 
    message,
  }),
};
