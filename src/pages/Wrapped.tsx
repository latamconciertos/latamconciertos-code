import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useWrappedData } from '@/hooks/queries/useWrapped';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import SpotifyConnectPrompt from '@/components/wrapped/SpotifyConnectPrompt';
import ConcertSelectionStep from '@/components/wrapped/ConcertSelectionStep';
import WrappedContainer from '@/components/wrapped/WrappedContainer';
import { Music } from 'lucide-react';
import logo from '@/assets/logo.png';

type WrappedStep = 'auth-check' | 'spotify-prompt' | 'concert-selection' | 'loading' | 'ready';

const WRAPPED_YEAR = 2026;

const Wrapped = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<WrappedStep>('auth-check');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [generateEnabled, setGenerateEnabled] = useState(false);
  const [userName, setUserName] = useState('');

  const { connection, isConnecting, connectSpotify } = useSpotifyAuth();
  const { data: wrappedData, isLoading, error } = useWrappedData(WRAPPED_YEAR, generateEnabled);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth', { replace: true });
        return;
      }
      setIsAuthenticated(true);

      // Get user display name
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, username')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        const name = profile.first_name
          ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
          : profile.username || session.user.email?.split('@')[0] || 'Usuario';
        setUserName(name);
      }

      // Check if user already has attended concerts for the year
      const { count: attendedCount } = await supabase
        .from('favorite_concerts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('attendance_type', 'attending');

      const hasAttendedConcerts = (attendedCount ?? 0) > 0;

      // If Spotify already connected, skip prompt
      if (connection.connected) {
        if (hasAttendedConcerts) {
          setStep('loading');
          setGenerateEnabled(true);
        } else {
          setStep('concert-selection');
        }
      } else {
        setStep('spotify-prompt');
      }
    };

    if (step === 'auth-check') {
      checkAuth();
    }
  }, [navigate, step, connection.connected]);

  // When Spotify connects while on the prompt, advance to concert-selection
  useEffect(() => {
    if (connection.connected && step === 'spotify-prompt') {
      setStep('concert-selection');
    }
  }, [connection.connected, step]);

  // Transition to ready when data arrives
  useEffect(() => {
    if (wrappedData && step === 'loading') {
      setStep('ready');
    }
  }, [wrappedData, step]);

  const handleSpotifySkip = () => {
    setStep('concert-selection');
  };

  const handleConcertSelectionDone = () => {
    setStep('loading');
    setGenerateEnabled(true);
  };

  const handleClose = () => {
    navigate('/');
  };

  if (!isAuthenticated || step === 'auth-check') {
    return null;
  }

  if (step === 'spotify-prompt') {
    return (
      <SpotifyConnectPrompt
        onConnect={connectSpotify}
        onSkip={handleSpotifySkip}
        isConnecting={isConnecting}
      />
    );
  }

  if (step === 'concert-selection') {
    return (
      <ConcertSelectionStep
        year={WRAPPED_YEAR}
        onComplete={handleConcertSelectionDone}
        onSkip={handleConcertSelectionDone}
      />
    );
  }

  if (step === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-violet-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="mb-6"
        >
          <Music className="h-12 w-12 text-purple-400" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-lg font-medium text-purple-200"
        >
          Generando tu Wrapped...
        </motion.p>
        <motion.div
          className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-white/10"
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '50%' }}
          />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-6">
        <p className="mb-4 text-center text-lg text-red-400">
          No pudimos generar tu Wrapped
        </p>
        <p className="mb-6 text-center text-sm text-gray-500">
          {error instanceof Error ? error.message : 'Error desconocido'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="rounded-full bg-white/10 px-6 py-2 text-sm text-white hover:bg-white/20 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  if (step === 'ready' && wrappedData) {
    return <WrappedContainer data={wrappedData} onClose={handleClose} userName={userName} logoSrc={logo} />;
  }

  return null;
};

export default Wrapped;
