/**
 * Supabase Error Mapping - Mapea errores de Supabase/PostgreSQL a AppError codes
 * 
 * Traduce códigos de error específicos de la base de datos y API a nuestro sistema.
 */

import { ErrorCode, type ErrorCodeType } from './errorCodes';

export interface SupabaseErrorLike {
  code?: string;
  message?: string;
  status?: number;
  statusCode?: number;
  details?: string;
  hint?: string;
}

export interface MappedError {
  code: ErrorCodeType;
  message?: string;
}

/**
 * Códigos de error de PostgreSQL
 */
const POSTGRES_ERROR_CODES: Record<string, ErrorCodeType> = {
  '23505': ErrorCode.ALREADY_EXISTS,   // unique_violation
  '23503': ErrorCode.FK_VIOLATION,     // foreign_key_violation
  '23502': ErrorCode.VALIDATION_ERROR, // not_null_violation
  '23514': ErrorCode.VALIDATION_ERROR, // check_violation
  '42501': ErrorCode.RLS_VIOLATION,    // insufficient_privilege
  '42P01': ErrorCode.NOT_FOUND,        // undefined_table
  '42703': ErrorCode.INVALID_INPUT,    // undefined_column
  '22P02': ErrorCode.INVALID_INPUT,    // invalid_text_representation
  '22003': ErrorCode.INVALID_INPUT,    // numeric_value_out_of_range
  '08006': ErrorCode.DB_ERROR,         // connection_failure
  '08001': ErrorCode.DB_ERROR,         // sqlclient_unable_to_establish_sqlconnection
  '57014': ErrorCode.TIMEOUT,          // query_canceled
  '57P01': ErrorCode.SERVICE_UNAVAILABLE, // admin_shutdown
};

/**
 * Códigos de error de PostgREST
 */
const POSTGREST_ERROR_CODES: Record<string, ErrorCodeType> = {
  'PGRST116': ErrorCode.NOT_FOUND,      // no rows returned
  'PGRST301': ErrorCode.DB_ERROR,       // connection error
  'PGRST302': ErrorCode.TIMEOUT,        // connection timeout
  'PGRST204': ErrorCode.VALIDATION_ERROR, // column not found
};

/**
 * Patrones de mensajes de error para detectar tipos de error
 */
const ERROR_MESSAGE_PATTERNS: Array<{ pattern: RegExp; code: ErrorCodeType; message?: string }> = [
  // Autenticación
  { pattern: /invalid.?login/i, code: ErrorCode.AUTH_INVALID, message: 'Email o contraseña incorrectos' },
  { pattern: /invalid.?credentials/i, code: ErrorCode.AUTH_INVALID, message: 'Credenciales inválidas' },
  { pattern: /user.?not.?found/i, code: ErrorCode.AUTH_INVALID, message: 'Usuario no encontrado' },
  { pattern: /email.?not.?confirmed/i, code: ErrorCode.AUTH_INVALID, message: 'Email no confirmado' },
  { pattern: /jwt.?expired/i, code: ErrorCode.AUTH_EXPIRED },
  { pattern: /refresh.?token.?expired/i, code: ErrorCode.AUTH_EXPIRED },
  { pattern: /session.?expired/i, code: ErrorCode.AUTH_EXPIRED },
  { pattern: /not.?authenticated/i, code: ErrorCode.AUTH_REQUIRED },
  { pattern: /unauthorized/i, code: ErrorCode.AUTH_REQUIRED },
  
  // Red
  { pattern: /failed.?to.?fetch/i, code: ErrorCode.NETWORK_ERROR },
  { pattern: /network.?error/i, code: ErrorCode.NETWORK_ERROR },
  { pattern: /net::ERR_/i, code: ErrorCode.NETWORK_ERROR },
  { pattern: /timeout/i, code: ErrorCode.TIMEOUT },
  
  // RLS
  { pattern: /row.?level.?security/i, code: ErrorCode.RLS_VIOLATION },
  { pattern: /new.?row.?violates/i, code: ErrorCode.RLS_VIOLATION, message: 'No tienes permisos para esta acción' },
  
  // Duplicados
  { pattern: /duplicate.?key/i, code: ErrorCode.ALREADY_EXISTS },
  { pattern: /already.?exists/i, code: ErrorCode.ALREADY_EXISTS },
  { pattern: /unique.?constraint/i, code: ErrorCode.ALREADY_EXISTS },
  
  // Storage
  { pattern: /payload.?too.?large/i, code: ErrorCode.FILE_TOO_LARGE },
  { pattern: /file.?size.?exceeded/i, code: ErrorCode.FILE_TOO_LARGE },
  { pattern: /storage/i, code: ErrorCode.STORAGE_ERROR },
];

/**
 * Mapea un error de Supabase/PostgreSQL a nuestro sistema de errores
 */
export function mapSupabaseError(error: SupabaseErrorLike): MappedError {
  const { code, message, status, statusCode } = error;
  const httpStatus = status || statusCode;
  
  // 1. Verificar código de PostgreSQL
  if (code && POSTGRES_ERROR_CODES[code]) {
    return { 
      code: POSTGRES_ERROR_CODES[code],
      message: getPostgresErrorMessage(code, message),
    };
  }
  
  // 2. Verificar código de PostgREST
  if (code && POSTGREST_ERROR_CODES[code]) {
    return { code: POSTGREST_ERROR_CODES[code] };
  }
  
  // 3. Verificar patrones en mensaje
  if (message) {
    for (const { pattern, code: errorCode, message: customMessage } of ERROR_MESSAGE_PATTERNS) {
      if (pattern.test(message)) {
        return { code: errorCode, message: customMessage };
      }
    }
  }
  
  // 4. Mapear por HTTP status code
  if (httpStatus) {
    const codeByStatus = mapHttpStatus(httpStatus);
    if (codeByStatus !== ErrorCode.UNKNOWN) {
      return { code: codeByStatus };
    }
  }
  
  // 5. Error desconocido
  return { code: ErrorCode.UNKNOWN };
}

/**
 * Mapea HTTP status codes a nuestros códigos de error
 */
function mapHttpStatus(status: number): ErrorCodeType {
  if (status === 400) return ErrorCode.INVALID_INPUT;
  if (status === 401) return ErrorCode.AUTH_REQUIRED;
  if (status === 403) return ErrorCode.AUTH_FORBIDDEN;
  if (status === 404) return ErrorCode.NOT_FOUND;
  if (status === 408) return ErrorCode.TIMEOUT;
  if (status === 409) return ErrorCode.CONFLICT;
  if (status === 413) return ErrorCode.FILE_TOO_LARGE;
  if (status === 422) return ErrorCode.VALIDATION_ERROR;
  if (status >= 500 && status < 600) return ErrorCode.SERVER_ERROR;
  if (status === 503) return ErrorCode.SERVICE_UNAVAILABLE;
  return ErrorCode.UNKNOWN;
}

/**
 * Obtiene un mensaje más descriptivo para errores de PostgreSQL
 */
function getPostgresErrorMessage(code: string, originalMessage?: string): string | undefined {
  switch (code) {
    case '23505':
      return 'Este registro ya existe';
    case '23503':
      return 'El registro referenciado no existe';
    case '23502':
      return 'Faltan campos requeridos';
    case '42501':
      return 'No tienes permisos para esta acción';
    default:
      return originalMessage;
  }
}
