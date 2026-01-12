import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UserProfile } from './queries/useProfile';

/**
 * Hook para manejar el popup de completar perfil para usuarios nuevos
 * Detecta si el perfil está incompleto y maneja el estado del dialog
 */
export const useProfileCompletion = (profile: UserProfile | null | undefined, userId: string | undefined) => {
    const [showDialog, setShowDialog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const queryClient = useQueryClient();

    // Detectar si el perfil está incompleto
    const isProfileIncomplete = (userProfile: UserProfile | null | undefined): boolean => {
        if (!userProfile) return false;

        // Campos requeridos: first_name, last_name, username
        return !userProfile.first_name || !userProfile.last_name || !userProfile.username;
    };

    // Mostrar dialog cuando el perfil esté incompleto
    useEffect(() => {
        if (profile && userId && isProfileIncomplete(profile)) {
            // Pequeño delay para que la UI se haya renderizado completamente
            const timer = setTimeout(() => {
                setShowDialog(true);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [profile, userId]);

    // Guardar el perfil actualizado
    const saveProfile = async (updatedProfile: Partial<UserProfile>) => {
        if (!userId) return;

        setIsSaving(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update(updatedProfile)
                .eq('id', userId);

            if (error) throw error;

            // Invalidar queries para refrescar datos
            await queryClient.invalidateQueries({ queryKey: ['profile', userId] });

            toast.success('¡Perfil completado!', {
                description: 'Tu información ha sido guardada exitosamente',
            });

            setShowDialog(false);
        } catch (error) {
            console.error('Error al guardar perfil:', error);
            toast.error('Error al guardar', {
                description: 'No se pudo guardar tu información. Intenta de nuevo.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return {
        showDialog,
        setShowDialog,
        isSaving,
        saveProfile,
        isProfileIncomplete: isProfileIncomplete(profile),
    };
};
