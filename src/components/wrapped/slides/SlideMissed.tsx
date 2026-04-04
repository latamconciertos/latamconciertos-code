import { motion } from 'framer-motion';
import { Music, CalendarX } from 'lucide-react';

interface SlideMissedProps {
  missedArtists: Array<{
    name: string;
    photoUrl: string | null;
    spotifyRank: number;
    concertTitle: string;
    concertDate: string;
    city: string;
  }>;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.6 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 14 },
  },
};

const SlideMissed = ({ missedArtists }: SlideMissedProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-red-950 via-rose-900 to-red-900 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-2"
      >
        <CalendarX className="h-10 w-10 text-red-300" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6 text-center text-2xl font-bold text-white sm:text-3xl"
      >
        Te perdiste estos shows
      </motion.h2>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex w-full max-w-sm flex-col gap-3 overflow-y-auto"
        style={{ maxHeight: '55vh' }}
      >
        {missedArtists.slice(0, 5).map((artist) => (
          <motion.div
            key={`${artist.name}-${artist.concertDate}`}
            variants={cardVariants}
            className="flex items-center gap-3 rounded-xl bg-white/10 p-3 backdrop-blur"
          >
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
              {artist.photoUrl ? (
                <img
                  src={artist.photoUrl}
                  alt={artist.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/10">
                  <Music className="h-6 w-6 text-white/40" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-white">{artist.name}</p>
              <p className="truncate text-xs text-red-200">{artist.concertTitle}</p>
              <p className="text-xs text-red-300/80">
                {artist.city} &middot; {artist.concertDate}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-300">
              #{artist.spotifyRank}
            </span>
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="mt-6 text-center text-sm text-red-200/80"
      >
        No te los pierdas la proxima vez
      </motion.p>
    </div>
  );
};

export default SlideMissed;
