import { motion } from 'framer-motion';
import { MapPin, Star, Users, Music } from 'lucide-react';

interface FloatingItem {
  icon: React.ReactNode;
  label: string;
  sub: string;
  delay: number;
  position: string;
}

const items: FloatingItem[] = [
  {
    icon: <MapPin className="w-4 h-4 text-blue-500 dark:text-blue-400" />,
    label: '+10 pts',
    sub: 'Concierto confirmado',
    delay: 0.2,
    position: '-top-6 -left-10 md:-left-16',
  },
  {
    icon: <Star className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />,
    label: 'Nivel Fan',
    sub: '340 / 500 pts',
    delay: 0.5,
    position: '-bottom-4 -left-8 md:-left-14',
  },
  {
    icon: <Users className="w-4 h-4 text-green-500 dark:text-green-400" />,
    label: '+50 pts',
    sub: 'Amigo invitado',
    delay: 0.8,
    position: '-top-4 -right-10 md:-right-16',
  },
  {
    icon: <Music className="w-4 h-4 text-purple-500 dark:text-purple-400" />,
    label: '+25 pts',
    sub: 'Setlist subido',
    delay: 1.1,
    position: '-bottom-6 -right-8 md:-right-14',
  },
];

export const FloatingCards = () => (
  <>
    {items.map((item) => (
      <motion.div
        key={item.label}
        className={`absolute ${item.position} z-20 bg-card border border-border rounded-xl px-3 py-2 shadow-lg backdrop-blur-sm flex items-center gap-2.5 whitespace-nowrap`}
        initial={{ opacity: 0, scale: 0.7, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          delay: item.delay,
          duration: 0.5,
          ease: [0.34, 1.56, 0.64, 1],
        }}
      >
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
          {item.icon}
        </div>
        <div>
          <p className="text-foreground text-xs font-bold leading-none mb-0.5">{item.label}</p>
          <p className="text-muted-foreground text-[10px] leading-none">{item.sub}</p>
        </div>
      </motion.div>
    ))}
  </>
);
