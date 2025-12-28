import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFanProjectStorage } from '@/hooks/useFanProjectStorage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ColorBlock {
  start: number;
  end: number;
  color: string;
}

const FanProjectLightMode = () => {
  const { projectId, songId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getSequence } = useFanProjectStorage();
  
  const [sequence, setSequence] = useState<ColorBlock[]>([]);
  const [mode, setMode] = useState<'fixed' | 'strobe'>('fixed');
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [isPlaying, setIsPlaying] = useState(false);
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
      
      const stored = getSequence(projectId!, songId!, participantData.venue_section_id);
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

  const handlePlay = async () => {
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
          // Strobe effect: alternate between color and black every 100ms
          const strobeInterval = 100; // ms
          const currentMs = Date.now() % (strobeInterval * 2);
          setCurrentColor(currentMs < strobeInterval ? currentBlock.color : '#000000');
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
      className="fixed inset-0 w-screen h-screen transition-colors duration-300"
      style={{ backgroundColor: currentColor }}
    >
      {!isPlaying ? (
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
