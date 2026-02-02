import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFanProjectStorage } from '@/hooks/useFanProjectStorage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, Play, Sun, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ColorBlock {
  start: number;
  end: number;
  color: string;
  strobeColor2?: string; // Second color for strobe effect
}

const FanProjectLightMode = () => {
  const { projectId, songId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getSequence } = useFanProjectStorage();

  const [sequence, setSequence] = useState<ColorBlock[]>([]);
  const [mode, setMode] = useState<'fixed' | 'strobe'>('fixed');
  const [strobeSpeed, setStrobeSpeed] = useState<number>(80); // Speed in ms
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showBrightnessWarning, setShowBrightnessWarning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [sectionId, setSectionId] = useState<string>('');
  const animationFrameRef = useRef<number>();
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    const loadSequence = async () => {
      // Get user's selected section
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: participantData } = await supabase
        .from('fan_project_participants')
        .select('venue_section_id')
        .eq('fan_project_id', projectId!)
        .eq('user_id', session.user.id)
        .single();

      if (!participantData) {
        toast({
          title: 'Selecciona tu localidad',
          description: 'Primero debes seleccionar tu localidad en el proyecto',
          variant: 'destructive',
        });
        navigate(`/fan-projects/${projectId}`);
        return;
      }

      setSectionId(participantData.venue_section_id);

      const stored = await getSequence(projectId!, songId!, participantData.venue_section_id);
      if (!stored) {
        toast({
          title: 'Secuencia no encontrada',
          description: 'Debes precargar la secuencia primero',
          variant: 'destructive',
        });
        navigate(`/fan-projects/${projectId}`);
        return;
      }
      setSequence(stored.sequence);
      setMode(stored.mode);
      setStrobeSpeed(stored.strobeSpeed || 80); // Use configured speed or default to 80ms
    };

    loadSequence();
  }, [projectId, songId, getSequence, navigate, toast]);

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock activated');
        }
      } catch (error) {
        console.error('Wake Lock error:', error);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  const handlePlay = () => {
    setShowBrightnessWarning(true);
  };

  const handleConfirmPlay = async () => {
    setShowBrightnessWarning(false);

    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error('Fullscreen error:', error);
    }

    setIsPlaying(true);
    setStartTime(Date.now());
  };

  const handleExit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setIsPlaying(false);
    navigate(`/fan-projects/${projectId}`);
  };

  useEffect(() => {
    if (!isPlaying || !startTime || sequence.length === 0) return;

    const updateColor = () => {
      const elapsed = (Date.now() - startTime) / 1000; // seconds

      const currentBlock = sequence.find(
        block => elapsed >= block.start && elapsed < block.end
      );

      if (currentBlock) {
        if (mode === 'strobe') {
          // Strobe effect: alternate between two colors using configured speed
          const currentMs = Date.now() % (strobeSpeed * 2);
          const color2 = currentBlock.strobeColor2 || '#FFFFFF'; // White by default for max brightness
          setCurrentColor(currentMs < strobeSpeed ? currentBlock.color : color2);
        } else {
          setCurrentColor(currentBlock.color);
        }
      } else if (elapsed >= sequence[sequence.length - 1].end) {
        // Sequence finished
        setCurrentColor('#000000');
        setIsPlaying(false);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(updateColor);
    };

    animationFrameRef.current = requestAnimationFrame(updateColor);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, startTime, sequence, mode]);

  return (
    <div
      className="fixed inset-0 w-screen h-screen"
      style={{ backgroundColor: currentColor }}
    >
      {!isPlaying && !showBrightnessWarning ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            size="lg"
            className="text-lg px-8 py-6"
            onClick={handlePlay}
          >
            <Play className="h-6 w-6 mr-3" />
            Iniciar Secuencia
          </Button>
        </div>
      ) : null}

      {showBrightnessWarning && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm p-6">
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Sun className="h-16 w-16 text-yellow-400 animate-pulse" />
                <AlertTriangle className="h-8 w-8 text-orange-500 absolute -top-2 -right-2" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-4">
              ⚡ Ajusta el Brillo al Máximo
            </h2>

            <div className="space-y-3 mb-6 text-white/90">
              <p className="flex items-start gap-2">
                <Sun className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>Sube el brillo de tu pantalla al <strong>100%</strong></span>
              </p>
              <p className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                <span>Esto garantiza el <strong>máximo impacto visual</strong></span>
              </p>
              <p className="text-sm text-white/70 mt-4 p-3 bg-black/30 rounded-lg">
                💡 Los efectos de luz funcionan mejor con brillo máximo
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/30"
                onClick={() => setShowBrightnessWarning(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold shadow-lg"
                onClick={handleConfirmPlay}
              >
                <Play className="h-5 w-5 mr-2" />
                ¡Listo, Iniciar!
              </Button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleExit}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-all"
        aria-label="Salir"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

export default FanProjectLightMode;
