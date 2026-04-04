import { motion } from 'framer-motion';
import { Sparkles, CalendarCheck, CalendarDays, TrendingUp } from 'lucide-react';

interface SlideFunFactsProps {
  firstConcert: { title: string; date: string; artist: string } | null;
  lastConcert: { title: string; date: string; artist: string } | null;
  busiestMonth: { month: string; count: number } | null;
}

const cardVariants = {
  hidden: { opacity: 0, rotateX: -90 },
  visible: (i: number) => ({
    opacity: 1,
    rotateX: 0,
    transition: {
      delay: 0.5 + i * 0.3,
      type: 'spring' as const,
      stiffness: 80,
      damping: 12,
    },
  }),
};

const SlideFunFacts = ({ firstConcert, lastConcert, busiestMonth }: SlideFunFactsProps) => {
  const facts = [
    firstConcert && {
      icon: CalendarCheck,
      label: 'Tu primer concierto del ano',
      value: firstConcert.artist,
      sub: `${firstConcert.title} - ${firstConcert.date}`,
    },
    lastConcert && {
      icon: CalendarDays,
      label: 'Tu ultimo concierto',
      value: lastConcert.artist,
      sub: `${lastConcert.title} - ${lastConcert.date}`,
    },
    busiestMonth && {
      icon: TrendingUp,
      label: 'Tu mes mas activo',
      value: busiestMonth.month,
      sub: `${busiestMonth.count} ${busiestMonth.count === 1 ? 'show' : 'shows'}`,
    },
  ].filter(Boolean) as Array<{
    icon: typeof CalendarCheck;
    label: string;
    value: string;
    sub: string;
  }>;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-cyan-900 via-sky-800 to-blue-900 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-2"
      >
        <Sparkles className="h-10 w-10 text-cyan-300" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8 text-center text-2xl font-bold text-white sm:text-3xl"
      >
        Datos curiosos
      </motion.h2>

      <div className="flex w-full max-w-sm flex-col gap-4" style={{ perspective: 800 }}>
        {facts.map((fact, i) => {
          const Icon = fact.icon;
          return (
            <motion.div
              key={fact.label}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="rounded-xl bg-white/10 p-4 backdrop-blur"
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-5 w-5 text-cyan-300" />
                <span className="text-xs font-medium uppercase tracking-wider text-cyan-200">
                  {fact.label}
                </span>
              </div>
              <p className="text-xl font-bold text-white">{fact.value}</p>
              <p className="text-sm text-sky-200/80">{fact.sub}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SlideFunFacts;
