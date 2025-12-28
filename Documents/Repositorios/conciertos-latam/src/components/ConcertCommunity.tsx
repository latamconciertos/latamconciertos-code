import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Users, MessageCircle } from 'lucide-react';

interface ConcertCommunityProps {
  concertId: string;
  concertTitle: string;
}

const ConcertCommunity = ({ concertId, concertTitle }: ConcertCommunityProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    initializeCommunity();
  }, [concertId]);

  const initializeCommunity = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Verificar o crear comunidad
      let { data: community, error: communityError } = await supabase
        .from('concert_communities')
        .select('id')
        .eq('concert_id', concertId)
        .single();

      if (communityError && communityError.code === 'PGRST116') {
        // Crear comunidad si no existe
        const { data: newCommunity, error: createError } = await supabase
          .from('concert_communities')
          .insert({
            concert_id: concertId,
            name: `Comunidad ${concertTitle}`,
            description: `Comunidad de fans para el concierto: ${concertTitle}`
          })
          .select()
          .single();

        if (createError) throw createError;
        community = newCommunity;
      }

      if (!community) return;

      // Verificar membresía
      const { data: membership } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', community.id)
        .eq('user_id', session.user.id)
        .single();

      setIsMember(!!membership);

      // Obtener cantidad de miembros
      const { count } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', community.id);

      setMemberCount(count || 0);
    } catch (error) {
      console.error('Error initializing community:', error);
      toast.error('Error al cargar la comunidad');
    } finally {
      setLoading(false);
    }
  };

  const openFullChat = () => {
    navigate(`/concerts/${concertId}/chat`);
  };

  const joinCommunity = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Debes iniciar sesión para unirte');
        return;
      }

      const { data: community } = await supabase
        .from('concert_communities')
        .select('id')
        .eq('concert_id', concertId)
        .single();

      if (!community) return;

      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: community.id,
          user_id: session.user.id
        });

      if (error) throw error;

      setIsMember(true);
      setMemberCount(prev => prev + 1);
      toast.success('¡Te has unido a la comunidad!');
      
      // Navigate to full chat
      navigate(`/concerts/${concertId}/chat`);
    } catch (error) {
      console.error('Error joining community:', error);
      toast.error('Error al unirse a la comunidad');
    }
  };


  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!isMember) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Comunidad del concierto
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Únete para chatear con otros asistentes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="text-center space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'} en la comunidad
            </p>
            <Button onClick={joinCommunity} disabled={loading} className="w-full" size="sm">
              Unirse a la Comunidad
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Comunidad del concierto
          </div>
          <Button onClick={openFullChat} size="sm" className="text-xs sm:text-sm">
            <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Abrir Chat
          </Button>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'} en la comunidad
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        <p className="text-xs sm:text-sm text-muted-foreground text-center">
          Haz clic en "Abrir Chat" para conversar con otros fans
        </p>
      </CardContent>
    </Card>
  );
};

export default ConcertCommunity;
