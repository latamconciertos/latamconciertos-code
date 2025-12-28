/**
 * Error Messages - Mensajes user-friendly en español
 * 
 * Mensajes localizados para cada código de error con título, descripción y acción sugerida.
 */

import { ErrorCode, type ErrorCodeType } from './errorCodes';

export interface ErrorMessage {
  title: string;
  description: string;
  action?: string;
}

/**
 * Mensajes user-friendly en español para cada código de error
 */
export const ERROR_MESSAGES: Record<ErrorCodeType, ErrorMessage> = {
  [ErrorCode.NETWORK_ERROR]: {
    title: 'Error de conexión',
    description: 'No pudimos conectar con el servidor. Verifica tu conexión a internet.',
    action: 'Reintentar',
  },
  [ErrorCode.TIMEOUT]: {
    title: 'Tiempo agotado',
    description: 'La operación tardó demasiado. Por favor, intenta de nuevo.',
    action: 'Reintentar',
  },
  [ErrorCode.OFFLINE]: {
    title: 'Sin conexión',
    description: 'Parece que estás sin conexión a internet. Verifica tu conexión.',
    action: 'Reintentar',
  },
  [ErrorCode.AUTH_REQUIRED]: {
    title: 'Sesión requerida',
    description: 'Debes iniciar sesión para realizar esta acción.',
    action: 'Iniciar sesión',
  },
  [ErrorCode.AUTH_INVALID]: {
    title: 'Credenciales inválidas',
    description: 'El email o contraseña son incorrectos. Por favor, verifica tus datos.',
    action: 'Intentar de nuevo',
  },
  [ErrorCode.AUTH_EXPIRED]: {
    title: 'Sesión expirada',
    description: 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.',
    action: 'Iniciar sesión',
  },
  [ErrorCode.AUTH_FORBIDDEN]: {
    title: 'Acceso denegado',
    description: 'No tienes permisos para realizar esta acción.',
  },
  [ErrorCode.NOT_FOUND]: {
    title: 'No encontrado',
    description: 'El recurso que buscas no existe o fue eliminado.',
    action: 'Ir al inicio',
  },
  [ErrorCode.ALREADY_EXISTS]: {
    title: 'Ya existe',
    description: 'Este registro ya existe en el sistema.',
  },
  [ErrorCode.CONFLICT]: {
    title: 'Conflicto',
    description: 'Hubo un conflicto al procesar la solicitud. Intenta de nuevo.',
    action: 'Reintentar',
  },
  [ErrorCode.VALIDATION_ERROR]: {
    title: 'Datos inválidos',
    description: 'Por favor, revisa los datos ingresados.',
  },
  [ErrorCode.INVALID_INPUT]: {
    title: 'Entrada inválida',
    description: 'Los datos ingresados no son válidos. Revisa e intenta de nuevo.',
  },
  [ErrorCode.SERVER_ERROR]: {
    title: 'Error del servidor',
    description: 'Ocurrió un error inesperado. Nuestro equipo ha sido notificado.',
    action: 'Reintentar',
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    title: 'Servicio no disponible',
    description: 'El servicio está temporalmente no disponible. Intenta más tarde.',
    action: 'Reintentar más tarde',
  },
  [ErrorCode.DB_ERROR]: {
    title: 'Error de base de datos',
    description: 'Hubo un problema al acceder a los datos. Intenta de nuevo.',
    action: 'Reintentar',
  },
  [ErrorCode.RLS_VIOLATION]: {
    title: 'Sin permisos',
    description: 'No tienes permisos para acceder a estos datos.',
  },
  [ErrorCode.FK_VIOLATION]: {
    title: 'Referencia inválida',
    description: 'El registro referenciado no existe o no puede ser modificado.',
  },
  [ErrorCode.STORAGE_ERROR]: {
    title: 'Error de almacenamiento',
    description: 'Hubo un problema al subir o descargar el archivo.',
    action: 'Reintentar',
  },
  [ErrorCode.FILE_TOO_LARGE]: {
    title: 'Archivo muy grande',
    description: 'El archivo excede el tamaño máximo permitido.',
  },
  [ErrorCode.UNKNOWN]: {
    title: 'Error inesperado',
    description: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
    action: 'Reintentar',
  },
};

/**
 * Obtiene el mensaje de error para un código dado
 */
export function getErrorMessage(code: ErrorCodeType): ErrorMessage {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCode.UNKNOWN];
}
