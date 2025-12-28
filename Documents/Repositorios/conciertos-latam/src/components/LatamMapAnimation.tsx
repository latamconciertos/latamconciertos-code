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

const LatamMapAnimation = () => {
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* SVG Container */}
      <svg viewBox="0 0 350 400" className="w-full h-auto">
        {/* Gradient definitions */}
        <defs>
          <radialGradient id="cityGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Real Latin America Map as background */}
        <image 
          href={LatamMapSvg} 
          x="0" 
          y="0" 
          width="350" 
          height="396"
          className="opacity-30"
          style={{ filter: 'hue-rotate(180deg) saturate(0.5)' }}
        />

        {/* Connection lines between major cities */}
        {cities.slice(0, -1).map((city, i) => (
          <motion.line
            key={`line-${i}`}
            x1={city.x}
            y1={city.y}
            x2={cities[i + 1].x}
            y2={cities[i + 1].y}
            stroke="hsl(var(--primary))"
            strokeWidth="0.5"
            strokeOpacity="0.2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: i * 0.1 }}
          />
        ))}

        {/* City points with pulse animation */}
        {cities.map((city, i) => (
          <g key={city.name}>
            {/* Outer pulse ring */}
            <motion.circle
              cx={city.x}
              cy={city.y}
              r={city.size}
              fill="url(#cityGlow)"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                scale: [1, 2, 1],
                opacity: [0.6, 0, 0.6]
              }}
              transition={{
                duration: 3,
                delay: i * 0.15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Inner pulse ring */}
            <motion.circle
              cx={city.x}
              cy={city.y}
              r={city.size * 0.6}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [1, 1.8],
                opacity: [0.8, 0]
              }}
              transition={{
                duration: 2,
                delay: i * 0.15 + 0.5,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />

            {/* Main city dot */}
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
              className="drop-shadow-[0_0_8px_hsl(var(--primary))]"
            />
          </g>
        ))}
      </svg>

      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50 pointer-events-none" />

      {/* Legend */}
      <motion.div 
        className="mt-6 flex flex-wrap justify-center gap-3 text-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        {['🇲🇽 México', '🇨🇴 Colombia', '🇦🇷 Argentina', '🇧🇷 Brasil', '🇨🇱 Chile', '🇵🇪 Perú'].map((country, i) => (
          <motion.span 
            key={country}
            className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5 + i * 0.1 }}
          >
            {country}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
};

export default LatamMapAnimation;
