import { motion } from 'framer-motion';
import { Calendar, Clock, Music } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SlideAttendanceProps {
  totalConcerts: number;
  totalFestivals: number;
  estimatedHours: number;
}

function useCounter(target: number, duration = 1500, delay = 300) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now() + delay;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 0) {
        requestAnimationFrame(animate);
        return;
      }
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration, delay]);

  return value;
}

const SlideAttendance = ({ totalConcerts, totalFestivals, estimatedHours }: SlideAttendanceProps) => {
  const concertCount = useCounter(totalConcerts, 1500, 400);
  const festivalCount = useCounter(totalFestivals, 1200, 800);
  const hourCount = useCounter(estimatedHours, 1200, 1000);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-sky-900 px-6">
      {/* Label */}
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-3 text-base font-medium text-blue-200/80"
      >
        Este ano fuiste a
      </motion.p>

      {/* Hero number */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
        className="mb-1"
      >
        <span className="text-8xl font-black tabular-nums text-white sm:text-9xl">
          {concertCount}
        </span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mb-14 text-xl font-semibold text-blue-100/90"
      >
        {totalConcerts === 1 ? 'concierto' : 'conciertos'}
      </motion.p>

      {/* Secondary stats */}
      <div className="flex w-full max-w-xs flex-col gap-3">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-4 rounded-2xl bg-white/[0.08] px-5 py-4 backdrop-blur-sm"
        >
          <Music className="h-5 w-5 text-blue-300/80" />
          <div>
            <span className="text-xl font-bold tabular-nums text-white">{festivalCount}</span>
            <p className="text-xs text-blue-200/70">festivales</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0 }}
          className="flex items-center gap-4 rounded-2xl bg-white/[0.08] px-5 py-4 backdrop-blur-sm"
        >
          <Clock className="h-5 w-5 text-blue-300/80" />
          <div>
            <span className="text-xl font-bold tabular-nums text-white">{hourCount}</span>
            <p className="text-xs text-blue-200/70">horas estimadas en shows</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2 }}
          className="flex items-center gap-4 rounded-2xl bg-white/[0.08] px-5 py-4 backdrop-blur-sm"
        >
          <Calendar className="h-5 w-5 text-blue-300/80" />
          <div>
            <span className="text-xl font-bold tabular-nums text-white">{totalConcerts}</span>
            <p className="text-xs text-blue-200/70">dias con musica en vivo</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SlideAttendance;
