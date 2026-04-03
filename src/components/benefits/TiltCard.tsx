import { useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { Star } from 'lucide-react';

interface TiltCardProps {
  level?: string;
  points?: number;
  concerts?: number;
}

export const TiltCard = ({ level = 'Fan', points = 340, concerts = 7 }: TiltCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Raw mouse position relative to card center (–0.5 to +0.5)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics
  const springConfig = { stiffness: 300, damping: 30, mass: 0.5 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig);

  // Shine overlay position
  const shineX = useSpring(useTransform(mouseX, [-0.5, 0.5], ['150%', '-50%']), springConfig);
  const shineY = useSpring(useTransform(mouseY, [-0.5, 0.5], ['150%', '-50%']), springConfig);

  // Glow color intensity
  const glowOpacity = useSpring(useTransform(mouseX, [-0.5, 0.5], [0.15, 0.4]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      className="relative select-none"
      style={{ perspective: '1200px' }}
    >
      {/* Dynamic glow */}
      <motion.div
        className="absolute -inset-6 rounded-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, #2563eb, transparent 70%)',
          opacity: glowOpacity,
          filter: 'blur(20px)',
        }}
      />

      {/* Tilt wrapper */}
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-[300px] sm:w-[340px] md:w-[380px] cursor-default"
      >
        {/* Card body */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #004aad 0%, #1e40af 40%, #312e81 80%, #4c1d95 100%)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Shine overlay */}
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: `radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.12) 0%, transparent 60%)`,
            }}
          />

          {/* Noise texture */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E\")",
              backgroundSize: 'cover',
            }}
          />

          {/* Decorative circles – lifted in Z */}
          <div
            className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/5"
            style={{ transform: 'translateZ(20px)' }}
          />
          <div
            className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5"
            style={{ transform: 'translateZ(10px)' }}
          />
          <div
            className="absolute top-1/2 right-6 w-20 h-20 rounded-full bg-white/5"
            style={{ transform: 'translateZ(15px)' }}
          />

          {/* Content */}
          <div className="relative p-7" style={{ transform: 'translateZ(30px)' }}>
            {/* Header row */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-white/50 text-[10px] font-semibold tracking-[0.2em] uppercase">
                  Conciertos LATAM
                </p>
                <p className="text-white font-bold text-lg tracking-wide">LATAM PASS</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
              </div>
            </div>

            {/* Level badge */}
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full mb-5">
              <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
              <span className="text-white text-xs font-semibold">{level}</span>
            </div>

            {/* Points big display */}
            <div className="mb-5">
              <p className="text-white/50 text-[11px] uppercase tracking-widest mb-0.5">
                Puntos acumulados
              </p>
              <p className="text-white text-4xl font-bold tabular-nums">
                {points.toLocaleString()}
              </p>
            </div>

            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex justify-between text-[10px] text-white/50 mb-1.5">
                <span>Progreso al siguiente nivel</span>
                <span>{points} / 500 pts</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full"
                  style={{ width: `${Math.min((points / 500) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-6 pt-4 border-t border-white/10">
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-widest">Conciertos</p>
                <p className="text-white font-bold text-lg">{concerts}</p>
              </div>
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-widest">Badges</p>
                <p className="text-white font-bold text-lg">3</p>
              </div>
              <div className="ml-auto flex items-end">
                <p className="text-white/30 text-[10px] font-mono">CL·2025</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
