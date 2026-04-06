import { motion } from 'framer-motion';
import LatamMapSvg from '@/assets/latam-map.svg';

const cities = [
  { name: 'Ciudad de México', country: '🇲🇽', x: 95, y: 45, size: 8 },
  { name: 'Guatemala', country: '🇬🇹', x: 115, y: 65, size: 5 },
  { name: 'San José', country: '🇨🇷', x: 130, y: 95, size: 5 },
  { name: 'Panamá', country: '🇵🇦', x: 145, y: 105, size: 5 },
  { name: 'Bogotá', country: '🇨🇴', x: 155, y: 135, size: 7 },
  { name: 'Medellín', country: '🇨🇴', x: 148, y: 125, size: 5 },
  { name: 'Quito', country: '🇪🇨', x: 140, y: 160, size: 5 },
  { name: 'Lima', country: '🇵🇪', x: 140, y: 200, size: 6 },
  { name: 'Santo Domingo', country: '🇩🇴', x: 195, y: 70, size: 5 },
  { name: 'Caracas', country: '🇻🇪', x: 185, y: 105, size: 5 },
  { name: 'São Paulo', country: '🇧🇷', x: 235, y: 280, size: 8 },
  { name: 'Río de Janeiro', country: '🇧🇷', x: 250, y: 275, size: 6 },
  { name: 'Buenos Aires', country: '🇦🇷', x: 195, y: 350, size: 8 },
  { name: 'Montevideo', country: '🇺🇾', x: 210, y: 345, size: 5 },
  { name: 'Santiago', country: '🇨🇱', x: 160, y: 340, size: 7 },
  { name: 'La Paz', country: '🇧🇴', x: 175, y: 235, size: 5 },
];

const countries = ['🇲🇽 México', '🇨🇴 Colombia', '🇦🇷 Argentina', '🇧🇷 Brasil', '🇨🇱 Chile', '🇵🇪 Perú'];

const LatamMapAnimation = () => {
  return (
    <div className="relative w-full max-w-sm md:max-w-md mx-auto" role="img" aria-label="Mapa interactivo de Latinoamérica mostrando ciudades con presencia de Conciertos Latam">
      {/* SVG Container */}
      <svg viewBox="0 0 350 400" className="w-full h-auto">
        <defs>
          <radialGradient id="cityGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Map background */}
        <image
          href={LatamMapSvg}
          x="0"
          y="0"
          width="350"
          height="396"
          className="opacity-40"
          style={{ filter: 'hue-rotate(180deg) saturate(0.5) brightness(1.2)' }}
        />

        {/* Connection lines */}
        {cities.slice(0, -1).map((city, i) => (
          <motion.line
            key={`line-${i}`}
            x1={city.x}
            y1={city.y}
            x2={cities[i + 1].x}
            y2={cities[i + 1].y}
            stroke="hsl(var(--primary))"
            strokeWidth="0.6"
            strokeOpacity="0.25"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: i * 0.1 }}
          />
        ))}

        {/* City points */}
        {cities.map((city, i) => (
          <g key={city.name}>
            <motion.circle
              cx={city.x}
              cy={city.y}
              r={city.size}
              fill="url(#cityGlow)"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{
                duration: 3,
                delay: i * 0.15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            <motion.circle
              cx={city.x}
              cy={city.y}
              r={city.size * 0.4}
              fill="hsl(var(--primary))"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                delay: i * 0.1
              }}
              className="drop-shadow-[0_0_6px_hsl(var(--primary))]"
            />
          </g>
        ))}
      </svg>

      {/* Fade edges */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background/30 via-transparent to-background/50" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-background/20 via-transparent to-background/20" />

      {/* Country badges */}
      <motion.div
        className="flex flex-wrap justify-center gap-2 mt-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        {countries.map((country, i) => (
          <motion.span
            key={country}
            className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 + i * 0.08 }}
          >
            {country}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
};

export default LatamMapAnimation;
