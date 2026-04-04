import { motion } from 'framer-motion';
import { Music, CalendarX } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

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

function formatDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, "d 'de' MMMM, yyyy", { locale: es });
  } catch {
    return dateStr;
  }
}

const SlideMissed = ({ missedArtists }: SlideMissedProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-red-950 via-rose-900 to-red-900 px-6">
      {/* Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-3"
      >
        <CalendarX className="h-8 w-8 text-red-300/70" />
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8 text-center text-2xl font-bold text-white sm:text-3xl"
      >
        Te perdiste estos shows
      </motion.h2>

      {/* Cards - scrollable */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex w-full max-w-sm flex-col gap-2.5 overflow-y-auto"
        style={{ maxHeight: '50vh' }}
      >
        {missedArtists.slice(0, 5).map((artist) => (
          <motion.div
            key={`${artist.name}-${artist.concertDate}`}
            variants={cardVariants}
            className="flex items-center gap-3 rounded-xl bg-white/[0.08] p-3 backdrop-blur-sm"
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
              {artist.photoUrl ? (
                <img
                  src={artist.photoUrl}
                  alt={artist.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/10">
                  <Music className="h-5 w-5 text-white/30" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{artist.name}</p>
              <p className="truncate text-xs text-red-200/70">{artist.concertTitle}</p>
              <p className="text-[11px] text-red-300/50">
                {artist.city} &middot; {formatDate(artist.concertDate)}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-green-500/15 px-2 py-0.5 text-[11px] font-medium text-green-300/80">
              #{artist.spotifyRank}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Footer message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="mt-8 text-center text-xs text-red-200/40"
      >
        No te los pierdas la proxima vez
      </motion.p>
    </div>
  );
};

export default SlideMissed;
