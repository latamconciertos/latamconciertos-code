import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { WrappedData, WrappedSlideType } from '@/types/wrapped';
import WrappedProgressBar from './WrappedProgressBar';
import SlideIntro from './slides/SlideIntro';
import SlideAttendance from './slides/SlideAttendance';
import SlideTopArtist from './slides/SlideTopArtist';
import SlideCities from './slides/SlideCities';
import SlideGenre from './slides/SlideGenre';
import SlideMissed from './slides/SlideMissed';
import SlideFunFacts from './slides/SlideFunFacts';
import SlideSummary from './slides/SlideSummary';

interface WrappedContainerProps {
  data: WrappedData;
  onClose: () => void;
}

const AUTO_ADVANCE_MS = 6000;

function getActiveSlides(data: WrappedData): WrappedSlideType[] {
  const slides: WrappedSlideType[] = ['intro', 'attendance'];

  if (data.topArtistByConcerts) {
    slides.push('top-artist');
  }

  if (data.citiesVisited.length > 0) {
    slides.push('cities');
  }

  if (data.spotifyConnected && data.topGenre && data.genreBreakdown.length > 0) {
    slides.push('genre');
  }

  if (data.spotifyConnected && data.missedArtists.length > 0) {
    slides.push('missed');
  }

  if (data.firstConcert || data.lastConcert || data.busiestMonth) {
    slides.push('fun-facts');
  }

  slides.push('summary');

  return slides;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
};

const WrappedContainer = ({ data, onClose }: WrappedContainerProps) => {
  const activeSlides = getActiveSlides(data);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(false);

  const totalSlides = activeSlides.length;
  const isLastSlide = currentIndex === totalSlides - 1;

  const resetAutoAdvance = useCallback(() => {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
    }
    pausedRef.current = false;
  }, []);

  const startAutoAdvance = useCallback(() => {
    resetAutoAdvance();
    if (isLastSlide) return;

    autoTimerRef.current = setTimeout(() => {
      if (!pausedRef.current) {
        setDirection(1);
        setCurrentIndex((prev) => Math.min(prev + 1, totalSlides - 1));
      }
    }, AUTO_ADVANCE_MS);
  }, [isLastSlide, totalSlides, resetAutoAdvance]);

  useEffect(() => {
    startAutoAdvance();
    return resetAutoAdvance;
  }, [currentIndex, startAutoAdvance, resetAutoAdvance]);

  const goNext = useCallback(() => {
    if (currentIndex < totalSlides - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, totalSlides]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, onClose]);

  // Touch/click navigation
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const threshold = rect.width * 0.35;

    if (x < threshold) {
      goPrev();
    } else {
      goNext();
    }
  };

  const renderSlide = (slideType: WrappedSlideType) => {
    switch (slideType) {
      case 'intro':
        return <SlideIntro year={data.year} />;
      case 'attendance':
        return (
          <SlideAttendance
            totalConcerts={data.totalConcerts}
            totalFestivals={data.totalFestivals}
            estimatedHours={data.estimatedHours}
          />
        );
      case 'top-artist':
        return data.topArtistByConcerts ? (
          <SlideTopArtist artist={data.topArtistByConcerts} />
        ) : null;
      case 'cities':
        return (
          <SlideCities
            cities={data.citiesVisited}
            uniqueCitiesCount={data.uniqueCitiesCount}
          />
        );
      case 'genre':
        return data.topGenre ? (
          <SlideGenre
            topGenre={data.topGenre}
            genreBreakdown={data.genreBreakdown}
          />
        ) : null;
      case 'missed':
        return <SlideMissed missedArtists={data.missedArtists} />;
      case 'fun-facts':
        return (
          <SlideFunFacts
            firstConcert={data.firstConcert}
            lastConcert={data.lastConcert}
            busiestMonth={data.busiestMonth}
          />
        );
      case 'summary':
        return <SlideSummary data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-black">
      {/* Progress bar */}
      <WrappedProgressBar currentSlide={currentIndex} totalSlides={totalSlides} />

      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed right-4 top-8 z-50 rounded-full bg-black/30 p-2 text-white backdrop-blur transition-colors hover:bg-black/50"
        aria-label="Cerrar"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Slide area */}
      <div className="h-full w-full" onClick={handleTap}>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={activeSlides[currentIndex]}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_e, info) => {
              if (info.offset.x < -60) goNext();
              else if (info.offset.x > 60) goPrev();
            }}
            className="h-full w-full"
          >
            {renderSlide(activeSlides[currentIndex])}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WrappedContainer;
