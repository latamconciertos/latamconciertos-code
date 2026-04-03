/**
 * ErrorMessage - Componente inline para mostrar errores
 * 
 * Para errores pequeños dentro de formularios o secciones.
 */

import { AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  /** Título del error (opcional) */
  title?: string;
  /** Mensaje de error */
  message: string;
  /** Callback para reintentar */
  onRetry?: () => void;
  /** Callback para cerrar/dismiss */
  onDismiss?: () => void;
  /** Variante de visualización */
  variant?: 'default' | 'compact' | 'inline';
  /** Clases adicionales */
  className?: string;
}

export function ErrorMessage({ 
  title, 
  message, 
  onRetry,
  onDismiss,
  variant = 'default',
  className,
}: ErrorMessageProps) {
  // Variante compacta (solo texto e icono)
  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center gap-2 text-sm text-destructive",
        className
      )}>
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">{message}</span>
        {onRetry && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onRetry}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
        {onDismiss && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onDismiss}
            className="h-6 w-6 p-0"
          >
            <XCircle className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }
  
  // Variante inline (para formularios)
  if (variant === 'inline') {
    return (
      <p className={cn(
        "text-sm text-destructive flex items-center gap-1.5",
        className
      )}>
        <AlertCircle className="h-3.5 w-3.5" />
        {message}
      </p>
    );
  }
  
  // Variante default (Alert completo)
  return (
    <Alert variant="destructive" className={cn("relative", className)}>
      <AlertCircle className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription className="flex items-center justify-between gap-4">
        <span className="flex-1">{message}</span>
        <div className="flex gap-2 flex-shrink-0">
          {onRetry && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onRetry}
              className="h-7"
            >
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Reintentar
            </Button>
          )}
          {onDismiss && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onDismiss}
              className="h-7 w-7 p-0"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Componente para mostrar errores de carga de datos
 */
interface LoadErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function LoadError({ 
  message = 'Error al cargar los datos', 
  onRetry,
  className,
}: LoadErrorProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-8 text-center",
      className
    )}>
      <AlertCircle className="h-10 w-10 text-destructive mb-3" />
      <p className="text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      )}
    </div>
  );
}
