/**
 * ErrorBoundary - Captura errores de renderizado de React
 * 
 * Previene que errores en componentes hijos causen un crash completo de la app.
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallbackStandalone, type ErrorFallbackProps } from './ErrorFallback';
import { AppError } from '@/lib/errors/AppError';
import { ErrorCode } from '@/lib/errors/errorCodes';

interface Props {
  children: ReactNode;
  /** Componente de fallback personalizado */
  fallback?: React.ComponentType<ErrorFallbackProps>;
  /** Callback cuando ocurre un error */
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  /** Keys que al cambiar resetean el error boundary */
  resetKeys?: unknown[];
}

interface State {
  error: AppError | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { error: null };

  public static getDerivedStateFromError(error: Error): State {
    // Convertir a AppError si no lo es
    const appError = error instanceof AppError 
      ? error 
      : new AppError({
          code: ErrorCode.UNKNOWN,
          message: error.message || 'Error de renderizado',
          cause: error,
          context: { 
            errorType: 'RenderError',
            originalName: error.name,
          },
        });
    
    return { error: appError };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = this.state.error || new AppError({
      code: ErrorCode.UNKNOWN,
      message: error.message,
      cause: error,
    });
    
    // Log detallado para debugging
    console.error('[ErrorBoundary] Caught rendering error:', {
      error: appError.toJSON(),
      componentStack: errorInfo.componentStack,
    });
    
    // Callback opcional
    this.props.onError?.(appError, errorInfo);
  }

  public componentDidUpdate(prevProps: Props) {
    // Resetear si las resetKeys cambian
    if (
      this.state.error && 
      this.props.resetKeys && 
      prevProps.resetKeys !== this.props.resetKeys
    ) {
      // Comparar arrays
      const keysChanged = !areArraysEqual(
        prevProps.resetKeys || [], 
        this.props.resetKeys
      );
      
      if (keysChanged) {
        this.handleReset();
      }
    }
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  public render() {
    const { error } = this.state;
    const { children, fallback: FallbackComponent = ErrorFallbackStandalone } = this.props;

    if (error) {
      return (
        <FallbackComponent 
          error={error} 
          resetError={this.handleReset}
        />
      );
    }

    return children;
  }
}

/**
 * Compara dos arrays para igualdad superficial
 */
function areArraysEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
}
