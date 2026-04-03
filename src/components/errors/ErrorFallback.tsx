/**
 * ErrorFallback - UI de fallback para errores
 * 
 * Muestra una interfaz amigable cuando ocurre un error.
 */

import { AlertTriangle, RefreshCw, Home, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { AppError } from '@/lib/errors/AppError';
import { ErrorCode } from '@/lib/errors/errorCodes';
import { Link, useNavigate } from 'react-router-dom';

export interface ErrorFallbackProps {
  error: AppError;
  resetError?: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const { title, description, action } = error.userMessage;
  const showAuthAction = error.isAuthError;
  const showRetry = error.isRetryable && resetError;
  
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center border-destructive/20">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        </CardHeader>
        
        <CardContent className="pb-6">
          <p className="text-muted-foreground">{description}</p>
          
          {/* Debug info solo en desarrollo */}
          {import.meta.env.DEV && (
            <details className="mt-4 text-left text-xs bg-muted p-3 rounded-lg">
              <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                Información de debug
              </summary>
              <pre className="mt-2 overflow-auto text-muted-foreground whitespace-pre-wrap break-words">
                {JSON.stringify(
                  {
                    code: error.code,
                    message: error.message,
                    severity: error.severity,
                    context: error.context,
                    timestamp: error.timestamp.toISOString(),
                  }, 
                  null, 
                  2
                )}
              </pre>
            </details>
          )}
        </CardContent>
        
        <CardFooter className="flex gap-3 justify-center flex-wrap">
          {showRetry && (
            <Button onClick={resetError} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {action || 'Reintentar'}
            </Button>
          )}
          
          {showAuthAction ? (
            <Link to="/auth">
              <Button>
                <LogIn className="h-4 w-4 mr-2" />
                Iniciar sesión
              </Button>
            </Link>
          ) : (
            <Link to="/">
              <Button variant={showRetry ? 'ghost' : 'default'}>
                <Home className="h-4 w-4 mr-2" />
                Ir al inicio
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * Versión standalone que puede usarse fuera de React Router
 */
export function ErrorFallbackStandalone({ error, resetError }: ErrorFallbackProps) {
  const { title, description } = error.userMessage;
  
  const handleGoHome = () => {
    window.location.href = '/';
  };
  
  const handleLogin = () => {
    window.location.href = '/auth';
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md text-center border-destructive/20">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        </CardHeader>
        
        <CardContent className="pb-6">
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
        
        <CardFooter className="flex gap-3 justify-center flex-wrap">
          {resetError && (
            <Button onClick={resetError} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          )}
          
          {error.isAuthError ? (
            <Button onClick={handleLogin}>
              <LogIn className="h-4 w-4 mr-2" />
              Iniciar sesión
            </Button>
          ) : (
            <Button onClick={handleGoHome} variant={resetError ? 'ghost' : 'default'}>
              <Home className="h-4 w-4 mr-2" />
              Ir al inicio
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
