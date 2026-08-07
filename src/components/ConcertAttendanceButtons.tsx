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
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ring-1 ring-linea bg-noche/80 backdrop-blur-sm ${interaction.isFavorite
          ? 'text-red-500 hover:text-red-400'
          : 'text-texto hover:text-red-400'
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
          className={`rounded-full transition-all duration-200 ${interaction.isFavorite
            ? 'border-linea bg-transparent text-red-500 hover:bg-superficie-2 hover:text-red-400'
            : 'border-linea bg-transparent text-texto-2 hover:bg-superficie-2 hover:text-red-400'
            }`}
          title="Favorito"
        >
          <Heart className={`h-4 w-4 ${interaction.isFavorite ? 'fill-current' : ''}`} />
        </Button>

        <ToggleGroup
          type="single"
          value={interaction.attendanceType || ''}
          onValueChange={(value) => handleAttendanceChange(value as AttendanceType || null)}
          className="rounded-full border border-linea bg-superficie p-1"
        >
          <ToggleGroupItem
            value="attending"
            aria-label="Voy a asistir"
            disabled={loading}
            className={`rounded-full px-3 py-2 text-sm transition-all duration-200 ${interaction.attendanceType === 'attending'
              ? 'bg-verde/15 text-verde data-[state=on]:bg-verde/15 data-[state=on]:text-verde'
              : 'text-texto-2 hover:bg-superficie-2 hover:text-texto'
              }`}
          >
            <CalendarCheck className="h-4 w-4 mr-1" />
            Voy
          </ToggleGroupItem>
          <ToggleGroupItem
            value="tentative"
            aria-label="Tentativo"
            disabled={loading}
            className={`rounded-full px-3 py-2 text-sm transition-all duration-200 ${interaction.attendanceType === 'tentative'
              ? 'bg-periwinkle/15 text-periwinkle data-[state=on]:bg-periwinkle/15 data-[state=on]:text-periwinkle'
              : 'text-texto-2 hover:bg-superficie-2 hover:text-texto'
              }`}
          >
            <CalendarClock className="h-4 w-4 mr-1" />
            Quizás
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    );
  }

  // Default full layout - responsive attendance buttons
  return (
    <ToggleGroup
      type="single"
      value={interaction.attendanceType || ''}
      onValueChange={(value) => handleAttendanceChange(value as AttendanceType || null)}
      className="w-full flex flex-row gap-2"
    >
      <ToggleGroupItem
        value="attending"
        aria-label="Voy a asistir"
        disabled={loading}
        className={`flex-1 gap-2 py-3.5 px-4 justify-center transition-all duration-200 min-h-[48px] font-medium rounded-full border ${interaction.attendanceType === 'attending'
          ? 'border-verde/40 bg-verde/15 text-verde data-[state=on]:bg-verde/15 data-[state=on]:text-verde hover:bg-verde/20'
          : 'border-linea bg-transparent text-texto-2 hover:bg-superficie-2 hover:text-texto hover:border-[rgba(89,124,255,.35)]'
          }`}
      >
        <CalendarCheck className="h-4 w-4" />
        Voy a asistir
      </ToggleGroupItem>
      <ToggleGroupItem
        value="tentative"
        aria-label="Tentativo"
        disabled={loading}
        className={`flex-1 gap-2 py-3.5 px-4 justify-center transition-all duration-200 min-h-[48px] font-medium rounded-full border ${interaction.attendanceType === 'tentative'
          ? 'border-periwinkle/40 bg-periwinkle/15 text-periwinkle data-[state=on]:bg-periwinkle/15 data-[state=on]:text-periwinkle hover:bg-periwinkle/20'
          : 'border-linea bg-transparent text-texto-2 hover:bg-superficie-2 hover:text-texto hover:border-[rgba(89,124,255,.35)]'
          }`}
      >
        <CalendarClock className="h-4 w-4" />
        Tentativo
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default ConcertAttendanceButtons;
