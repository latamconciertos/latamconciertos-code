import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Music } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PendingContribution {
  id: string;
  song_name: string;
  artist_name: string | null;
  notes: string | null;
  concert_id: string;
  contributed_by: string;
  created_at: string;
  concert: {
    title: string;
    date: string | null;
  };
  contributor: {
    email: string;
  };
}

export function SetlistContributionsAdmin() {
  const [contributions, setContributions] = useState<PendingContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchContributions();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('setlist-contributions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'setlist_songs',
          filter: 'status=eq.pending'
        },
        () => {
          fetchContributions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchContributions = async () => {
    try {
      const { data, error } = await supabase
        .from('setlist_songs')
        .select(`
          *,
          concert:concerts!inner(title, date)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get contributor emails
      const contributionsWithEmails = await Promise.all(
        (data || []).map(async (contrib) => {
          const { data: userData } = await supabase.auth.admin.getUserById(contrib.contributed_by!);
          return {
            ...contrib,
            contributor: { email: userData?.user?.email || 'Desconocido' }
          };
        })
      );

      setContributions(contributionsWithEmails as any);
    } catch (error) {
      console.error('Error fetching contributions:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las contribuciones',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (contributionId: string) => {
    try {
      const { error } = await supabase
        .from('setlist_songs')
        .update({ status: 'approved' })
        .eq('id', contributionId);

      if (error) throw error;

      // Mark notification as read
      await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('reference_id', contributionId)
        .eq('reference_type', 'setlist_song');

      toast({
        title: 'Contribución aprobada',
        description: 'La canción ahora es visible en el setlist'
      });

      await fetchContributions();
    } catch (error) {
      console.error('Error approving contribution:', error);
      toast({
        title: 'Error',
        description: 'No se pudo aprobar la contribución',
        variant: 'destructive'
      });
    }
  };

  const handleReject = async (contributionId: string) => {
    try {
      const { error } = await supabase
        .from('setlist_songs')
        .update({ status: 'rejected' })
        .eq('id', contributionId);

      if (error) throw error;

      // Mark notification as read
      await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('reference_id', contributionId)
        .eq('reference_type', 'setlist_song');

      toast({
        title: 'Contribución rechazada',
        description: 'La canción ha sido rechazada'
      });

      await fetchContributions();
    } catch (error) {
      console.error('Error rejecting contribution:', error);
      toast({
        title: 'Error',
        description: 'No se pudo rechazar la contribución',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="p-4">Cargando contribuciones...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Contribuciones de Setlist</h2>
        <p className="text-muted-foreground mt-2">
          Revisa y aprueba las canciones que los usuarios han agregado a los setlists
        </p>
      </div>

      {contributions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay contribuciones pendientes</h3>
              <p className="text-muted-foreground">
                Todas las contribuciones han sido revisadas
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contributions.map((contribution) => (
            <Card key={contribution.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{contribution.song_name}</CardTitle>
                    <CardDescription className="mt-1">
                      {contribution.artist_name && (
                        <span className="block">{contribution.artist_name}</span>
                      )}
                      <span className="block mt-1">
                        Concierto: {contribution.concert.title}
                        {contribution.concert.date && ` • ${new Date(contribution.concert.date).toLocaleDateString('es')}`}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Pendiente</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contribution.notes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Notas:</p>
                      <p className="text-sm text-muted-foreground italic">
                        {contribution.notes}
                      </p>
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    <span>Contribuido por: </span>
                    <span className="font-medium">{contribution.contributor.email}</span>
                    <span className="ml-2">•</span>
                    <span className="ml-2">
                      {new Date(contribution.created_at).toLocaleDateString('es', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleApprove(contribution.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Aprobar
                    </Button>
                    <Button
                      onClick={() => handleReject(contribution.id)}
                      size="sm"
                      variant="destructive"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
