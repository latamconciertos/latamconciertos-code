/**
 * Admin auth guard hook
 *
 * Verifies the current user has the `admin` role and redirects to /auth or /
 * otherwise. Returns an `isReady` flag so consumers can defer rendering until
 * the check has resolved.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseRequireAdminResult {
  user: User | null;
  isReady: boolean;
}

export const useRequireAdmin = (): UseRequireAdminResult => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate('/auth');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      const hasAdminRole = roles?.some((r) => r.role === 'admin');

      if (!hasAdminRole) {
        toast({
          title: 'Acceso denegado',
          description: 'No tienes permisos de administrador',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      if (!cancelled) {
        setUser(session.user);
        setIsReady(true);
      }
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) navigate('/auth');
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return { user, isReady };
};
