/**
 * AppError - Clase de error personalizada con información estructurada
 * 
 * Proporciona errores tipados con código, severidad, contexto y mensajes user-friendly.
 */

import { 
  ErrorCode, 
  type ErrorCodeType, 
  type ErrorSeverity,
  ERROR_SEVERITY_MAP,
  ERROR_STATUS_MAP,
} from './errorCodes';
import { getErrorMessage } from './errorMessages';

export interface AppErrorOptions {
  message?: string;
  code?: ErrorCodeType;
  severity?: ErrorSeverity;
  statusCode?: number;
  isOperational?: boolean;
  context?: Record<string, unknown>;
  cause?: Error;
}

// Auth error codes for type checking
const AUTH_ERROR_CODES: ErrorCodeType[] = [
  ErrorCode.AUTH_REQUIRED,
  ErrorCode.AUTH_INVALID,
  ErrorCode.AUTH_EXPIRED,
  ErrorCode.AUTH_FORBIDDEN,
];

// Retryable error codes
const RETRYABLE_ERROR_CODES: ErrorCodeType[] = [
  ErrorCode.NETWORK_ERROR,
  ErrorCode.TIMEOUT,
  ErrorCode.OFFLINE,
  ErrorCode.SERVICE_UNAVAILABLE,
  ErrorCode.SERVER_ERROR,
];

/**
 * Clase de error personalizada con información estructurada
 */
export class AppError extends Error {
  public readonly code: ErrorCodeType;
  public readonly severity: ErrorSeverity;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly originalCause?: Error;

  constructor(options: AppErrorOptions = {}) {
    const code = options.code || ErrorCode.UNKNOWN;
    const { description } = getErrorMessage(code);
    
    super(options.message || description);
    
    this.name = 'AppError';
    this.code = code;
    this.severity = options.severity || ERROR_SEVERITY_MAP[code] || 'error';
    this.statusCode = options.statusCode || ERROR_STATUS_MAP[code] || 500;
    this.isOperational = options.isOperational ?? true;
    this.context = options.context;
    this.timestamp = new Date();
    
    // Mantener la causa original para debugging
    if (options.cause) {
      this.originalCause = options.cause;
    }
    
    // Capturar stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Obtener mensaje user-friendly
   */
  get userMessage(): { title: string; description: string; action?: string } {
    return getErrorMessage(this.code);
  }

  /**
   * Verificar si es un error de autenticación
   */
  get isAuthError(): boolean {
    return AUTH_ERROR_CODES.includes(this.code);
  }

  /**
   * Verificar si es un error recuperable (el usuario puede reintentar)
   */
  get isRetryable(): boolean {
    return RETRYABLE_ERROR_CODES.includes(this.code);
  }

  /**
   * Serializar para logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }

  /**
   * Crear desde un error genérico
   */
  static from(error: unknown, options?: Partial<AppErrorOptions>): AppError {
    if (error instanceof AppError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new AppError({
        message: error.message,
        cause: error,
        ...options,
      });
    }
    
    return new AppError({
      message: typeof error === 'string' ? error : 'Error desconocido',
      ...options,
    });
  }
}
