import { motion } from 'framer-motion';

interface WrappedProgressBarProps {
  currentSlide: number;
  totalSlides: number;
}

const WrappedProgressBar = ({ currentSlide, totalSlides }: WrappedProgressBarProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-[3px] px-3 pt-3 pb-1">
      {Array.from({ length: totalSlides }).map((_, i) => (
        <div
          key={i}
          className="relative h-[2px] flex-1 rounded-full bg-white/20 overflow-hidden"
        >
          {i < currentSlide && (
            <div className="absolute inset-0 rounded-full bg-white/90" />
          )}
          {i === currentSlide && (
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-white/90"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 6, ease: 'linear' }}
              key={`progress-${currentSlide}`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default WrappedProgressBar;
