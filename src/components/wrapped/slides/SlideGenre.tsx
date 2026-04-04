import { motion } from 'framer-motion';

interface SlideGenreProps {
  topGenre: string;
  genreBreakdown: Array<{ genre: string; count: number }>;
}

const genreEmojis: Record<string, string> = {
  rock: '🎸',
  pop: '🎤',
  'hip-hop': '🎧',
  rap: '🎧',
  reggaeton: '🔥',
  'r&b': '🎵',
  electronic: '🎛️',
  jazz: '🎷',
  metal: '🤘',
  indie: '🎶',
  latin: '💃',
  cumbia: '🪇',
  salsa: '💃',
  punk: '⚡',
  folk: '🪕',
  classical: '🎻',
};

const SlideGenre = ({ topGenre, genreBreakdown }: SlideGenreProps) => {
  const maxCount = genreBreakdown.length > 0 ? genreBreakdown[0].count : 1;
  const emoji = genreEmojis[topGenre.toLowerCase()] || '🎵';

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-pink-900 via-fuchsia-800 to-purple-900 px-6">
      {/* Label */}
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-4 text-base font-medium text-pink-200/80"
      >
        Tu genero favorito
      </motion.p>

      {/* Emoji */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring' }}
        className="mb-3 text-5xl"
      >
        {emoji}
      </motion.div>

      {/* Genre name - big and bold */}
      <motion.h2
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
        className="mb-12 text-center text-5xl font-black capitalize text-white sm:text-6xl"
      >
        {topGenre}
      </motion.h2>

      {/* Bar chart - clean with proper spacing */}
      <div className="w-full max-w-xs space-y-4">
        {genreBreakdown.slice(0, 5).map((item, i) => (
          <motion.div
            key={item.genre}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 + i * 0.15 }}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium capitalize text-white/90">
                {item.genre}
              </span>
              <span className="text-xs tabular-nums text-pink-200/60">
                {item.count}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-pink-400 to-fuchsia-400"
                initial={{ width: 0 }}
                animate={{ width: `${(item.count / maxCount) * 100}%` }}
                transition={{ delay: 1.0 + i * 0.15, duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SlideGenre;
