/**
 * Error Codes - Catálogo centralizado de códigos de error
 * 
 * Códigos categorizados por dominio para manejo consistente de errores.
 */

export const ErrorCode = {
  // Red y conectividad
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  OFFLINE: 'OFFLINE',
  
  // Autenticación
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  
  // Recursos
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Validación
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Servidor
  SERVER_ERROR: 'SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Base de datos
  DB_ERROR: 'DB_ERROR',
  RLS_VIOLATION: 'RLS_VIOLATION',
  FK_VIOLATION: 'FK_VIOLATION',
  
  // Almacenamiento
  STORAGE_ERROR: 'STORAGE_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  
  // Desconocido
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

/**
 * Severidad del error para decidir cómo mostrarlo
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Mapeo de códigos a severidad por defecto
 */
export const ERROR_SEVERITY_MAP: Record<ErrorCodeType, ErrorSeverity> = {
  [ErrorCode.NETWORK_ERROR]: 'error',
  [ErrorCode.TIMEOUT]: 'warning',
  [ErrorCode.OFFLINE]: 'warning',
  [ErrorCode.AUTH_REQUIRED]: 'warning',
  [ErrorCode.AUTH_INVALID]: 'error',
  [ErrorCode.AUTH_EXPIRED]: 'warning',
  [ErrorCode.AUTH_FORBIDDEN]: 'error',
  [ErrorCode.NOT_FOUND]: 'warning',
  [ErrorCode.ALREADY_EXISTS]: 'warning',
  [ErrorCode.CONFLICT]: 'warning',
  [ErrorCode.VALIDATION_ERROR]: 'warning',
  [ErrorCode.INVALID_INPUT]: 'warning',
  [ErrorCode.SERVER_ERROR]: 'critical',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'critical',
  [ErrorCode.DB_ERROR]: 'error',
  [ErrorCode.RLS_VIOLATION]: 'error',
  [ErrorCode.FK_VIOLATION]: 'error',
  [ErrorCode.STORAGE_ERROR]: 'error',
  [ErrorCode.FILE_TOO_LARGE]: 'warning',
  [ErrorCode.UNKNOWN]: 'error',
};

/**
 * Mapeo de códigos a HTTP status codes
 */
export const ERROR_STATUS_MAP: Record<ErrorCodeType, number> = {
  [ErrorCode.NETWORK_ERROR]: 0,
  [ErrorCode.TIMEOUT]: 408,
  [ErrorCode.OFFLINE]: 0,
  [ErrorCode.AUTH_REQUIRED]: 401,
  [ErrorCode.AUTH_INVALID]: 401,
  [ErrorCode.AUTH_EXPIRED]: 401,
  [ErrorCode.AUTH_FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.SERVER_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.DB_ERROR]: 500,
  [ErrorCode.RLS_VIOLATION]: 403,
  [ErrorCode.FK_VIOLATION]: 400,
  [ErrorCode.STORAGE_ERROR]: 500,
  [ErrorCode.FILE_TOO_LARGE]: 413,
  [ErrorCode.UNKNOWN]: 500,
};
