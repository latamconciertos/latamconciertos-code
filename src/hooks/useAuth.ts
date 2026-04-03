import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Timeout de inactividad: 60 minutos (3,600,000 ms)
const INACTIVITY_TIMEOUT = 60 * 60 * 1000;

/**
 * Hook centralizado para manejo de autenticación y logout
 * Incluye:
 * - Logout robusto con limpieza completa
 * - Timeout automático de 60 minutos por inactividad
 * - Tracking de actividad del usuario
 */
export const useAuth = () => {
    const navigate = useNavigate();
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isLoggingOutRef = useRef(false);

    /**
     * Función robusta de cierre de sesión
     * Limpia sesión de Supabase, localStorage, estado y redirige
     */
    const logout = useCallback(async (reason: 'manual' | 'inactivity' = 'manual') => {
        // Prevenir múltiples llamadas simultáneas
        if (isLoggingOutRef.current) return;
        isLoggingOutRef.current = true;

        try {
            console.log('[useAuth] Iniciando logout:', reason);

            // 1. Cancelar timer de inactividad si existe
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
                inactivityTimerRef.current = null;
            }

            // 2. Cerrar sesión en Supabase
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('[useAuth] Error al cerrar sesión:', error);
                throw error;
            }

            // 3. Limpiar localStorage si hay datos de sesión almacenados
            // (Supabase ya limpia su propia data, pero por si acaso)
            const keysToRemove = Object.keys(localStorage).filter(key =>
                key.includes('supabase') || key.includes('auth')
            );
            keysToRemove.forEach(key => localStorage.removeItem(key));

            // 4. Mostrar mensaje apropiado
            if (reason === 'inactivity') {
                toast.info('Sesión cerrada por inactividad', {
                    description: 'Tu sesión se cerró después de 60 minutos de inactividad',
                    duration: 5000,
                });
            } else {
                toast.success('Sesión cerrada correctamente', {
                    description: 'Has cerrado sesión exitosamente',
                });
            }

            // 5. Redirigir a la página principal con replace para evitar volver atrás
            console.log('[useAuth] Logout completado, redirigiendo a /');
            navigate('/', { replace: true });
        } catch (error) {
            console.error('[useAuth] Error durante logout:', error);
            toast.error('Error al cerrar sesión', {
                description: 'Hubo un problema al cerrar la sesión. Intenta de nuevo.',
            });
        } finally {
            isLoggingOutRef.current = false;
        }
    }, [navigate]);

    /**
     * Resetea el timer de inactividad
     */
    const resetInactivityTimer = useCallback(() => {
        // Limpiar timer existente
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        // Crear nuevo timer
        inactivityTimerRef.current = setTimeout(() => {
            console.log('[useAuth] Timeout de inactividad alcanzado');
            logout('inactivity');
        }, INACTIVITY_TIMEOUT);
    }, [logout]);

    /**
     * Configura listeners de actividad y timer de inactividad
     */
    useEffect(() => {
        let mounted = true;

        const setupInactivityTracking = async () => {
            // Solo configurar si hay un usuario logueado
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.user || !mounted) {
                return;
            }

            console.log('[useAuth] Configurando tracking de inactividad para:', session.user.email);

            // Eventos que indican actividad del usuario
            const activityEvents = ['mousemove', 'keypress', 'click', 'touchstart', 'scroll'];

            // Handler que resetea el timer en cualquier actividad
            const handleActivity = () => {
                if (mounted) {
                    resetInactivityTimer();
                }
            };

            // Registrar listeners para todos los eventos de actividad
            activityEvents.forEach(event => {
                window.addEventListener(event, handleActivity, { passive: true });
            });

            // Iniciar el timer
            resetInactivityTimer();

            // Cleanup function
            return () => {
                mounted = false;
                if (inactivityTimerRef.current) {
                    clearTimeout(inactivityTimerRef.current);
                    inactivityTimerRef.current = null;
                }
                activityEvents.forEach(event => {
                    window.removeEventListener(event, handleActivity);
                });
            };
        };

        setupInactivityTracking();

        // Limpiar al desmontar
        return () => {
            mounted = false;
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
                inactivityTimerRef.current = null;
            }
        };
    }, [resetInactivityTimer]);

    return {
        logout,
    };
};
