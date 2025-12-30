import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import logo from '@/assets/logo.png';
import { useIsMobile } from '@/hooks/use-mobile';
interface HeroLandingProps {
  onScrollPastHero: (isPast: boolean) => void;
}
const HeroLanding = ({
  onScrollPastHero
}: HeroLandingProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowHeight, setWindowHeight] = useState(0);
  const isMobile = useIsMobile(); // Detect mobile for performance optimizations

  const {
    scrollY
  } = useScroll();

  // Parallax effects - simplified for stability across device sizes
  const y = useTransform(scrollY, [0, windowHeight], [0, windowHeight * 0.3]);
  const opacity = useTransform(scrollY, [0, windowHeight * 0.8], [1, 0]);
  const contentOpacity = useTransform(scrollY, [0, windowHeight * 0.5], [1, 0]);
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

  // Reduce animation duration on mobile for snappier feel
  const animDuration = isMobile ? 0.4 : 0.8;
  const auroraOpacity = isMobile ? 0.4 : 0.7;

  return <motion.div ref={containerRef} className="relative h-screen w-full overflow-hidden" style={{
    y
  }}>
    {/* Background - matching AuroraBackground */}
    <motion.div className="absolute inset-0 bg-[#0c1a3d]" style={{
      opacity
    }} />

    {/* Aurora effect - simplified for mobile performance */}
    <motion.div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      <div
        className={`
            [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,hsl(220,60%,15%)_0%,hsl(220,60%,15%)_7%,var(--transparent)_10%,var(--transparent)_12%,hsl(220,60%,15%)_16%)]
            [--aurora:repeating-linear-gradient(100deg,var(--blue-500)_10%,var(--indigo-300)_15%,var(--blue-300)_20%,var(--violet-200)_25%,var(--blue-400)_30%)]
            [--aurora-dark:repeating-linear-gradient(100deg,hsl(220,70%,35%)_10%,hsl(220,80%,45%)_15%,hsl(230,70%,40%)_20%,hsl(220,75%,50%)_25%,hsl(210,80%,40%)_30%)]
            [background-image:var(--dark-gradient),var(--aurora-dark)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            ${isMobile ? 'blur-[5px]' : 'blur-[10px]'}
            after:content-[""] after:absolute after:inset-0
            after:[background-image:var(--dark-gradient),var(--aurora-dark)]
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
            absolute -inset-[10px] ${isMobile ? 'opacity-40' : 'opacity-70'}
            ${isMobile ? '' : 'will-change-transform'}
            [mask-image:radial-gradient(ellipse_at_100%_0%,black_20%,var(--transparent)_70%)]
          `}
      />
    </motion.div>

    {/* Subtle radial glow effect */}
    <motion.div className="absolute inset-0" style={{
      opacity,
      background: 'radial-gradient(ellipse at 30% 40%, rgba(59, 130, 246, 0.25) 0%, transparent 50%)'
    }} />

    {/* Content container - no blur on mobile for better performance */}
    <motion.div className="relative z-10 flex flex-col items-center justify-center h-full px-4" style={{
      opacity: contentOpacity
    }}>
      {/* Logo - faster animation on mobile */}
      <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: animDuration,
        delay: 0.2
      }} className="mb-8">
        <img
          src={logo}
          alt="Conciertos LATAM"
          className="h-52 sm:h-36 md:h-44 w-auto object-contain"
          loading="eager"
          decoding="async"
        />
      </motion.div>

      {/* Main title - faster animation on mobile */}
      <motion.h1 initial={{
        opacity: 0,
        y: 30
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: animDuration,
        delay: 0.4
      }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-center font-fira leading-tight">
        <span className="text-white">La comunidad</span>
        <br />
        <span className="text-[hsl(120,45%,55%)]">de Conciertos</span>
      </motion.h1>

      {/* CTA Button - faster animation on mobile */}
      <motion.div initial={{
        opacity: 0,
        y: 30
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: animDuration,
        delay: 0.6
      }} className="mt-12">
        <Link to="/auth">
          <Button variant="ghost" className="text-white/90 hover:text-white hover:bg-white/10 text-lg font-fira font-medium px-8 py-3 h-auto border border-white/20 rounded-full transition-all hover:border-white/40">
            Únete ahora <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </motion.div>
    </motion.div>

    {/* Bottom fade gradient - matching AuroraBackground */}
    <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0c1a3d] via-[#0c1a3d]/50 to-transparent pointer-events-none" />

    {/* Scroll indicator */}
    <motion.button onClick={scrollToContent} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-white/90 transition-colors z-20" initial={{
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