import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Heart, CalendarCheck, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface ConcertAttendanceButtonsProps {
  concertId: string;
  compact?: boolean;
  /** Variant for floating favorite button on cards */
  variant?: 'default' | 'card-favorite';
}

type AttendanceType = 'attending' | 'tentative' | null;

interface UserInteraction {
  isFavorite: boolean;
  attendanceType: AttendanceType;
}

const ConcertAttendanceButtons = ({ 
  concertId, 
  compact = false,
  variant = 'default'
}: ConcertAttendanceButtonsProps) => {
  const [interaction, setInteraction] = useState<UserInteraction>({
    isFavorite: false,
    attendanceType: null
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkInteraction();
  }, [concertId]);

  const checkInteraction = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      setUser(session.user);

      const { data, error } = await supabase
        .from('favorite_concerts')
        .select('is_favorite, attendance_type')
        .eq('user_id', session.user.id)
        .eq('concert_id', concertId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setInteraction({
        isFavorite: data?.is_favorite || false,
        attendanceType: (data?.attendance_type as AttendanceType) || null
      });
    } catch (error) {
      console.error('Error checking interaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (!user) {
      toast.error('Debes iniciar sesión');
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const newIsFavorite = !interaction.isFavorite;
      
      const { data: existing } = await supabase
        .from('favorite_concerts')
        .select('id')
        .eq('user_id', user.id)
        .eq('concert_id', concertId)
        .maybeSingle();

      if (existing) {
        if (!newIsFavorite && !interaction.attendanceType) {
          await supabase
            .from('favorite_concerts')
            .delete()
            .eq('user_id', user.id)
            .eq('concert_id', concertId);
        } else {
          await supabase
            .from('favorite_concerts')
            .update({ is_favorite: newIsFavorite })
            .eq('user_id', user.id)
            .eq('concert_id', concertId);
        }
      } else {
        await supabase
          .from('favorite_concerts')
          .insert({
            user_id: user.id,
            concert_id: concertId,
            is_favorite: newIsFavorite,
            attendance_type: null
          });
      }

      setInteraction(prev => ({ ...prev, isFavorite: newIsFavorite }));
      toast.success(newIsFavorite ? 'Agregado a favoritos' : 'Eliminado de favoritos');
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast.error('Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = async (type: AttendanceType) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const newType = interaction.attendanceType === type ? null : type;

      const { data: existing } = await supabase
        .from('favorite_concerts')
        .select('id')
        .eq('user_id', user.id)
        .eq('concert_id', concertId)
        .maybeSingle();

      if (existing) {
        if (!interaction.isFavorite && !newType) {
          await supabase
            .from('favorite_concerts')
            .delete()
            .eq('user_id', user.id)
            .eq('concert_id', concertId);
        } else {
          await supabase
            .from('favorite_concerts')
            .update({ attendance_type: newType })
            .eq('user_id', user.id)
            .eq('concert_id', concertId);
        }
      } else if (newType) {
        await supabase
          .from('favorite_concerts')
          .insert({
            user_id: user.id,
            concert_id: concertId,
            is_favorite: false,
            attendance_type: newType
          });
      }

      setInteraction(prev => ({ ...prev, attendanceType: newType }));
      
      if (newType) {
        const messages = {
          attending: 'Marcado: Voy a asistir',
          tentative: 'Marcado: Tentativo'
        };
        toast.success(messages[newType]);
      } else {
        toast.success('Estado de asistencia eliminado');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  // Floating heart button for card corners
  if (variant === 'card-favorite') {
    return (
      <button
        onClick={handleFavoriteToggle}
        disabled={loading}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
          interaction.isFavorite 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'bg-white/90 text-red-500 hover:bg-white hover:text-red-600'
        } ${loading ? 'opacity-50' : ''}`}
        title={interaction.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      >
        <Heart className={`h-5 w-5 ${interaction.isFavorite ? 'fill-current' : ''}`} />
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex gap-2">
        <div className="h-9 w-24 animate-pulse bg-muted rounded"></div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleFavoriteToggle}
          disabled={loading}
          className={`transition-all duration-200 ${
            interaction.isFavorite 
              ? 'bg-red-500 hover:bg-red-600 border-red-500 text-white' 
              : 'border-red-300 text-red-500 hover:bg-red-50 hover:border-red-400 dark:hover:bg-red-500/10'
          }`}
          title="Favorito"
        >
          <Heart className={`h-4 w-4 ${interaction.isFavorite ? 'fill-current' : ''}`} />
        </Button>

        <ToggleGroup 
          type="single" 
          value={interaction.attendanceType || ''} 
          onValueChange={(value) => handleAttendanceChange(value as AttendanceType || null)}
          className="bg-muted/50 rounded-lg p-1"
        >
          <ToggleGroupItem
            value="attending"
            aria-label="Voy a asistir"
            disabled={loading}
            className={`px-3 py-2 text-sm transition-all duration-200 ${
              interaction.attendanceType === 'attending'
                ? 'bg-green-500 text-white data-[state=on]:bg-green-500 data-[state=on]:text-white'
                : 'text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-500/10'
            }`}
          >
            <CalendarCheck className="h-4 w-4 mr-1" />
            Voy
          </ToggleGroupItem>
          <ToggleGroupItem
            value="tentative"
            aria-label="Tentativo"
            disabled={loading}
            className={`px-3 py-2 text-sm transition-all duration-200 ${
              interaction.attendanceType === 'tentative'
                ? 'bg-yellow-500 text-white data-[state=on]:bg-yellow-500 data-[state=on]:text-white'
                : 'text-yellow-600 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-500/10'
            }`}
          >
            <CalendarClock className="h-4 w-4 mr-1" />
            Quizás
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    );
  }

  // Default full layout - only attendance buttons
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">¿Vas a asistir?</p>
      <ToggleGroup 
        type="single" 
        value={interaction.attendanceType || ''} 
        onValueChange={(value) => handleAttendanceChange(value as AttendanceType || null)}
        className="w-full grid grid-cols-2 gap-2"
      >
        <ToggleGroupItem
          value="attending"
          aria-label="Voy a asistir"
          disabled={loading}
          className={`flex-1 gap-2 py-3 transition-all duration-200 ${
            interaction.attendanceType === 'attending'
              ? 'bg-green-500 text-white border-green-500 data-[state=on]:bg-green-500 data-[state=on]:text-white'
              : 'border border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 dark:text-green-400 dark:hover:bg-green-500/10'
          }`}
        >
          <CalendarCheck className="h-4 w-4" />
          Voy a asistir
        </ToggleGroupItem>
        <ToggleGroupItem
          value="tentative"
          aria-label="Tentativo"
          disabled={loading}
          className={`flex-1 gap-2 py-3 transition-all duration-200 ${
            interaction.attendanceType === 'tentative'
              ? 'bg-yellow-500 text-white border-yellow-500 data-[state=on]:bg-yellow-500 data-[state=on]:text-white'
              : 'border border-yellow-300 text-yellow-600 hover:bg-yellow-50 hover:border-yellow-400 dark:text-yellow-400 dark:hover:bg-yellow-500/10'
          }`}
        >
          <CalendarClock className="h-4 w-4" />
          Tentativo
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default ConcertAttendanceButtons;
