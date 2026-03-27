import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TiltCard } from './TiltCard';
import { FloatingCards } from './FloatingCard';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.13 } },
};

export const HeroSection = () => {
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const cardY = useTransform(scrollYProgress, [0, 1], ['0px', '80px']);
  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.4], ['0px', '-40px']);

  return (
    <section
      ref={containerRef}
      className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden"
    >
      {/* Background glow blobs — visible in dark, subtle in light */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-700/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/8 dark:bg-indigo-800/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-600/5 dark:bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">

          {/* ── Left: Copy ─────────────────────────────────────────────── */}
          <motion.div
            className="flex-1 text-center lg:text-left"
            style={{ opacity: textOpacity, y: textY }}
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <Badge className="bg-blue-600/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 mb-5 px-4 py-1.5 text-sm">
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                Programa de Beneficios
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6 text-foreground"
            >
              Conciertos que<br />
              <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                te recompensan
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0"
            >
              Cada concierto suma. Acumula puntos, sube de nivel y desbloquea
              beneficios exclusivos: preventas anticipadas, descuentos y experiencias VIP.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center lg:items-start gap-3 justify-center lg:justify-start"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 px-8 h-12 text-base font-semibold shadow-lg shadow-blue-900/20 dark:shadow-blue-900/40"
                asChild
              >
                <Link to="/registro">
                  Empieza a ganar puntos
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-12 text-base text-muted-foreground hover:text-foreground"
                onClick={() => {
                  document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Cómo funciona
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              variants={fadeUp}
              className="mt-10 flex items-center gap-6 justify-center lg:justify-start"
            >
              {[
                { value: '4 niveles', label: 'de membresía' },
                { value: '5+ badges', label: 'coleccionables' },
                { value: '∞ puntos', label: 'por ganar' },
              ].map((stat) => (
                <div key={stat.value} className="text-center lg:text-left">
                  <p className="text-foreground font-bold text-lg leading-none">{stat.value}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right: 3D Card ─────────────────────────────────────────── */}
          <motion.div
            className="flex-1 flex justify-center lg:justify-end"
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ y: cardY }}
          >
            <div className="relative mx-16 md:mx-20">
              <FloatingCards />
              <TiltCard level="Fan" points={340} concerts={7} />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
