import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SlideIntroProps {
  year: number;
  userName?: string;
  logoSrc?: string;
}

const particles = Array.from({ length: 30 }).map((_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 6 + 2,
  duration: Math.random() * 3 + 2,
  delay: Math.random() * 2,
}));

const SlideIntro = ({ year, userName, logoSrc }: SlideIntroProps) => {
  const [displayYear, setDisplayYear] = useState(2000);

  useEffect(() => {
    const target = year;
    const start = 2000;
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayYear(Math.round(start + (target - start) * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const timeout = setTimeout(animate, 400);
    return () => clearTimeout(timeout);
  }, [year]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-950 px-6">
      {/* Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/20"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mb-4"
      >
        {logoSrc ? (
          <img src={logoSrc} alt="Conciertos Latam" className="h-24 w-auto sm:h-28" />
        ) : (
          <span className="text-lg font-semibold tracking-wide text-white/70">
            Conciertos Latam
          </span>
        )}
      </motion.div>

      {/* Greeting */}
      {userName && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-2 text-lg text-white/70"
        >
          Hola, <span className="font-semibold text-white">{userName}</span>
        </motion.p>
      )}

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.8, type: 'spring' as const }}
        className="mb-2 text-center text-3xl font-bold text-white sm:text-4xl"
      >
        Tu
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.8, type: 'spring' as const }}
        className="mb-2"
      >
        <span className="bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-8xl font-black tabular-nums text-transparent sm:text-9xl">
          {displayYear}
        </span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6 }}
        className="text-center text-3xl font-bold text-white sm:text-4xl"
      >
        en Conciertos
      </motion.h2>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.7, 0.4, 0.7] }}
        transition={{ delay: 2, duration: 2, repeat: Infinity }}
        className="absolute bottom-12 text-sm text-white/60"
      >
        Toca para continuar
      </motion.p>
    </div>
  );
};

export default SlideIntro;
