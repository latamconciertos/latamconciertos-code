import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Music, Headphones, BarChart3, ChevronRight } from 'lucide-react';

interface SpotifyConnectPromptProps {
  onConnect: () => void;
  onSkip: () => void;
  isConnecting: boolean;
}

const benefits = [
  {
    icon: Headphones,
    text: 'Descubre que artistas de tu Spotify tocaron cerca y te los perdiste',
  },
  {
    icon: BarChart3,
    text: 'Conoce tu genero musical mas visto en conciertos',
  },
  {
    icon: Music,
    text: 'Ve como se conectan tus gustos musicales con tus shows en vivo',
  },
];

const SpotifyConnectPrompt = ({ onConnect, onSkip, isConnecting }: SpotifyConnectPromptProps) => {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex w-full max-w-sm flex-col items-center"
      >
        {/* Spotify icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500"
        >
          <svg viewBox="0 0 24 24" className="h-10 w-10 fill-white">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-2 text-center text-2xl font-bold text-white"
        >
          Conecta tu Spotify
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8 text-center text-sm text-gray-400"
        >
          Desbloquea datos exclusivos en tu Wrapped
        </motion.p>

        {/* Benefits */}
        <div className="mb-8 w-full space-y-3">
          {benefits.map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.15 }}
                className="flex items-start gap-3 rounded-xl bg-white/5 p-3"
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
                <p className="text-sm text-gray-300">{benefit.text}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Connect button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="w-full"
        >
          <Button
            onClick={onConnect}
            disabled={isConnecting}
            className="w-full rounded-full bg-green-500 py-6 text-base font-bold text-white hover:bg-green-600"
          >
            {isConnecting ? 'Conectando...' : 'Conectar Spotify'}
          </Button>
        </motion.div>

        {/* Skip */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          onClick={onSkip}
          className="mt-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Continuar sin Spotify
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </motion.div>
    </div>
  );
};

export default SpotifyConnectPrompt;
