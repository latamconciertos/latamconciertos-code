import { motion } from 'framer-motion';
import { Sparkles, CalendarCheck, CalendarDays, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface SlideFunFactsProps {
  firstConcert: { title: string; date: string; artist: string } | null;
  lastConcert: { title: string; date: string; artist: string } | null;
  busiestMonth: { month: string; count: number } | null;
}

function formatDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, "d 'de' MMMM, yyyy", { locale: es });
  } catch {
    return dateStr;
  }
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
      sub: `${firstConcert.title} \u2014 ${formatDate(firstConcert.date)}`,
    },
    lastConcert && {
      icon: CalendarDays,
      label: 'Tu ultimo concierto',
      value: lastConcert.artist,
      sub: `${lastConcert.title} \u2014 ${formatDate(lastConcert.date)}`,
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
      {/* Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-3"
      >
        <Sparkles className="h-8 w-8 text-cyan-300/70" />
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-10 text-center text-2xl font-bold text-white sm:text-3xl"
      >
        Datos curiosos
      </motion.h2>

      {/* Fact cards - centered with proper spacing */}
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
              className="rounded-xl bg-white/[0.08] p-5 backdrop-blur-sm"
            >
              <div className="mb-2.5 flex items-center gap-2">
                <Icon className="h-4 w-4 text-cyan-300/70" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-cyan-200/60">
                  {fact.label}
                </span>
              </div>
              <p className="text-xl font-bold text-white">{fact.value}</p>
              <p className="mt-1 text-sm text-sky-200/60">{fact.sub}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SlideFunFacts;
