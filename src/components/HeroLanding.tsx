import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { useIsMobile } from '@/hooks/use-mobile';
import { StadiumArcs } from '@/components/newhome/StadiumArcs';

interface HeroLandingProps {
  onScrollPastHero: (isPast: boolean) => void;
}

const HeroLanding = ({
  onScrollPastHero
}: HeroLandingProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowHeight, setWindowHeight] = useState(0);
  const isMobile = useIsMobile();

  const { scrollY } = useScroll();

  // Parallax effects - optimized for smoother transition
  const y = useTransform(scrollY, [0, windowHeight], [0, windowHeight * 0.2]);
  const opacity = useTransform(scrollY, [0, windowHeight * 0.7], [1, 0]);
  const contentOpacity = useTransform(scrollY, [0, windowHeight * 0.6], [1, 0]);

  useEffect(() => {
    setWindowHeight(window.innerHeight);
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = scrollY.on('change', latest => {
      const threshold = windowHeight * 0.6;
      onScrollPastHero(latest > threshold);
    });
    return () => unsubscribe();
  }, [scrollY, windowHeight, onScrollPastHero]);

  const scrollToContent = () => {
    window.scrollTo({
      top: windowHeight,
      behavior: 'smooth'
    });
  };

  const animDuration = isMobile ? 0.4 : 0.8;

  return <motion.div ref={containerRef} className="fixed top-0 left-0 right-0 h-screen w-full overflow-hidden z-0 bg-noche" style={{ y }}>
    {/* Glow de escenario: morado en radial, nunca plano */}
    <motion.div
      className="absolute left-1/2 top-[36%] h-[420px] w-[min(760px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
      style={{
        opacity,
        background: 'radial-gradient(closest-side, rgba(117,22,226,.45), transparent 70%)',
        filter: isMobile ? 'blur(70px)' : 'blur(110px)'
      }}
    />

    {/* Elemento firma: arcos del isotipo como luz saliendo del horizonte */}
    <motion.div className="absolute inset-x-0 bottom-0 h-[55vh] pointer-events-none" style={{ opacity }}>
      <StadiumArcs className="w-full h-full" />
    </motion.div>

    {/* Content container */}
    <motion.div className="relative z-10 flex flex-col items-center justify-center h-full px-4" style={{
      opacity: contentOpacity
    }}>
      {/* Logo */}
      <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: animDuration,
        delay: 0.2
      }} className="mb-8 md:mb-10">
        <img
          src={logo}
          alt="Conciertos LATAM"
          className="h-36 sm:h-24 md:h-28 w-auto object-contain"
          loading="eager"
          decoding="async"
        />
      </motion.div>

      {/* Badge en vivo */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: animDuration, delay: 0.3 }}
        className="mb-6 flex items-center gap-2.5 rounded-full border border-linea bg-superficie/60 px-4 py-1.5"
      >
        <span className="h-2 w-2 rounded-full bg-naranja punto-vivo" />
        <span className="font-fira text-[11px] font-bold uppercase tracking-[0.14em] text-naranja">
          Música en vivo en toda Latinoamérica
        </span>
      </motion.div>

      {/* Titular: Big Shoulders, cartel de gira */}
      <motion.h1 initial={{
        opacity: 0,
        y: 30
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: animDuration,
        delay: 0.4
      }} className="font-display font-black uppercase tracking-[0.01em] text-center leading-[0.92] text-texto text-[clamp(48px,8.5vw,116px)]">
        Todos los conciertos
        <br />
        <span className="bg-[linear-gradient(92deg,#7516E2,#AB0DC4,#E70485,#FE670C)] bg-clip-text text-transparent">
          de Latinoamérica
        </span>
      </motion.h1>

      {/* Una sola línea de apoyo */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: animDuration, delay: 0.5 }}
        className="mt-6 text-center font-fira text-base sm:text-lg text-texto-2 max-w-xl"
      >
        Fechas, entradas, setlists y las historias detrás de cada show.
      </motion.p>

      {/* Un solo CTA */}
      <motion.div initial={{
        opacity: 0,
        y: 30
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: animDuration,
        delay: 0.6
      }} className="mt-10 md:mt-12">
        <Link to="/concerts" className="btn-nocturno px-10 text-base sm:text-lg">
          Ver próximos conciertos <ArrowRight className="h-5 w-5" />
        </Link>
      </motion.div>
    </motion.div>

    {/* Fade inferior hacia la noche */}
    <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-noche via-noche/80 to-transparent pointer-events-none" />

    {/* Scroll indicator */}
    <motion.button onClick={scrollToContent} aria-label="Bajar al contenido" className="absolute bottom-8 left-0 right-0 mx-auto w-12 h-12 flex items-center justify-center text-fucsia/60 hover:text-fucsia transition-colors z-20" initial={{
      opacity: 0
    }} animate={{
      opacity: 1,
      y: [0, 10, 0]
    }} transition={{
      opacity: {
        delay: 1,
        duration: 0.5
      },
      y: {
        delay: 1.5,
        duration: 1.5,
        repeat: Infinity
      }
    }}>
      <ChevronDown className="h-8 w-8" />
    </motion.button>
  </motion.div>;
};
export default HeroLanding;
