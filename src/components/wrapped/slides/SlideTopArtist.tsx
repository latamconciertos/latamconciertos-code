import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Music } from 'lucide-react';

interface SlideTopArtistProps {
  artist: {
    name: string;
    photoUrl: string | null;
    concertCount: number;
    spotifyRank: number | null;
  };
}

const SlideTopArtist = ({ artist }: SlideTopArtistProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const target = artist.concertCount;
    const duration = 1200;
    const startTime = Date.now() + 800;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 0) {
        requestAnimationFrame(animate);
        return;
      }
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [artist.concertCount]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-amber-800 via-orange-700 to-red-800 px-6">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6 text-lg font-medium text-amber-200"
      >
        Tu artista mas visto
      </motion.p>

      {/* Artist photo with glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 80 }}
        className="relative mb-6"
      >
        <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 opacity-60 blur-xl" />
        <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-white/30 sm:h-48 sm:w-48">
          {artist.photoUrl ? (
            <img
              src={artist.photoUrl}
              alt={artist.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/10">
              <Music className="h-16 w-16 text-white/40" />
            </div>
          )}
        </div>
      </motion.div>

      {/* Artist name */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mb-4 text-center text-4xl font-black text-white sm:text-5xl"
      >
        {artist.name}
      </motion.h2>

      {/* Concert count */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="mb-6 text-center text-xl text-amber-100"
      >
        Lo viste{' '}
        <span className="text-3xl font-bold tabular-nums text-white">{count}</span>
        {' '}{artist.concertCount === 1 ? 'vez' : 'veces'} en vivo
      </motion.p>

      {/* Spotify rank badge */}
      {artist.spotifyRank && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3, type: 'spring' }}
        >
          <Badge className="bg-green-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500">
            Tu artista #{artist.spotifyRank} en Spotify
          </Badge>
        </motion.div>
      )}
    </div>
  );
};

export default SlideTopArtist;
