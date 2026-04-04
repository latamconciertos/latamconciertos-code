import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

interface SlideCitiesProps {
  cities: Array<{ name: string; country: string; concertCount: number }>;
  uniqueCitiesCount: number;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.8 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 100, damping: 12 },
  },
};

const SlideCities = ({ cities, uniqueCitiesCount }: SlideCitiesProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 px-6">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-2 text-lg text-emerald-200"
      >
        Recorriste
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring' }}
        className="mb-2"
      >
        <span className="text-7xl font-black tabular-nums text-white sm:text-8xl">
          {uniqueCitiesCount}
        </span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mb-8 text-2xl font-semibold text-emerald-100"
      >
        {uniqueCitiesCount === 1 ? 'ciudad' : 'ciudades'}
      </motion.p>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid w-full max-w-sm grid-cols-2 gap-3"
      >
        {cities.slice(0, 6).map((city) => (
          <motion.div
            key={city.name}
            variants={cardVariants}
            className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 backdrop-blur"
          >
            <MapPin className="h-4 w-4 shrink-0 text-emerald-300" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{city.name}</p>
              <p className="text-xs text-emerald-300">
                {city.concertCount} {city.concertCount === 1 ? 'show' : 'shows'}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default SlideCities;
