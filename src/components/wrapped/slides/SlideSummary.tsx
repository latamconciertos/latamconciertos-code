import { motion } from 'framer-motion';
import { Music, MapPin, Users, Clock } from 'lucide-react';
import type { WrappedData } from '@/types/wrapped';
import WrappedShareButton from '../WrappedShareButton';

interface SlideSummaryProps {
  data: WrappedData;
}

const statVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.4 + i * 0.12, type: 'spring' as const, stiffness: 100 },
  }),
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 1.2 + i * 0.15, type: 'spring' as const, stiffness: 120 },
  }),
};

const SlideSummary = ({ data }: SlideSummaryProps) => {
  const stats = [
    { icon: Music, value: data.totalConcerts, label: 'Conciertos' },
    { icon: Users, value: data.totalArtistsSeen, label: 'Artistas' },
    { icon: MapPin, value: data.uniqueCitiesCount, label: 'Ciudades' },
    { icon: Clock, value: data.estimatedHours, label: 'Horas' },
  ];

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 px-6">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6 text-lg font-medium text-indigo-200"
      >
        Tu resumen {data.year}
      </motion.p>

      {/* Stats grid */}
      <div className="mb-8 grid w-full max-w-xs grid-cols-2 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              custom={i}
              variants={statVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center rounded-2xl bg-white/10 p-4 backdrop-blur"
            >
              <Icon className="mb-1 h-5 w-5 text-indigo-300" />
              <span className="text-3xl font-black tabular-nums text-white">
                {stat.value}
              </span>
              <span className="text-xs text-indigo-200">{stat.label}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Badges */}
      {data.badgesEarned.length > 0 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {data.badgesEarned.map((badge, i) => (
            <motion.div
              key={badge.name}
              custom={i}
              variants={badgeVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-3 py-1.5 backdrop-blur"
            >
              <span className="text-base">{badge.icon}</span>
              <span className="text-xs font-semibold text-yellow-200">
                {badge.name}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Share button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
      >
        <WrappedShareButton data={data} />
      </motion.div>

      {/* Branding */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0 }}
        className="mt-6 text-xs text-indigo-300/60"
      >
        Conciertos Latam &middot; conciertoslatam.app
      </motion.p>
    </div>
  );
};

export default SlideSummary;
