"use client";

import { Ref, forwardRef, useState, useEffect } from "react";
import { motion, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Photo {
  id: string;
  src: string;
  alt: string;
  title: string;
  summary?: string | null;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
  animationDelay?: number;
}

export const PhotoGallery = ({
  photos,
  onPhotoClick,
  animationDelay = 0.5,
}: PhotoGalleryProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const visibilityTimer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay * 1000);

    const animationTimer = setTimeout(
      () => {
        setIsLoaded(true);
      },
      (animationDelay + 0.4) * 1000
    );

    return () => {
      clearTimeout(visibilityTimer);
      clearTimeout(animationTimer);
    };
  }, [animationDelay]);

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const photoVariants = {
    hidden: {
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
    },
    visible: (custom: { x: string; y: string; order: number }) => ({
      x: custom.x,
      y: custom.y,
      rotate: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 70,
        damping: 12,
        mass: 1,
        delay: custom.order * 0.15,
      },
    }),
  };

  // Take first 5 photos and position them
  const displayPhotos = photos.slice(0, 5);
  const photoPositions = [
    { order: 0, x: "-280px", y: "15px", zIndex: 30, direction: "left" as Direction },
    { order: 1, x: "-140px", y: "32px", zIndex: 25, direction: "left" as Direction },
    { order: 2, x: "0px", y: "8px", zIndex: 20, direction: "right" as Direction },
    { order: 3, x: "140px", y: "22px", zIndex: 15, direction: "right" as Direction },
    { order: 4, x: "280px", y: "44px", zIndex: 10, direction: "left" as Direction },
  ];

  const galleryPhotos = displayPhotos.map((photo, index) => ({
    ...photo,
    ...photoPositions[index],
  }));

  return (
    <div className="relative mt-2 md:mt-4">
      <div className="absolute inset-0 max-md:hidden top-[60px] -z-10 h-[200px] w-full bg-transparent bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      
      <p className="lg:text-md mb-1 text-center text-xs font-light uppercase tracking-widest text-muted-foreground">
        Un viaje a través de historias visuales
      </p>
      <h2 className="section-title text-center mb-2 md:mb-4">
        Fotos <span className="text-primary">Destacadas</span>
      </h2>
      
      {/* Mobile: Horizontal scrollable carousel */}
      <div className="lg:hidden mb-4">
        <div 
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 py-2"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {displayPhotos.map((photo, index) => (
            <div 
              key={photo.id} 
              className="flex-shrink-0 snap-center first:ml-auto last:mr-auto"
            >
              <InteractivePhoto
                width={200}
                height={200}
                src={photo.src}
                alt={photo.alt}
                direction={index % 2 === 0 ? "left" : "right"}
                enableDrag={false}
                onClick={() => onPhotoClick(photo)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: Fan layout */}
      <div className="hidden lg:flex relative mb-4 h-[280px] w-full items-center justify-center z-10">
        <motion.div
          className="relative flex w-full max-w-5xl justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.div
            className="relative flex w-full justify-center"
            variants={containerVariants}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
          >
            <div className="relative h-[200px] w-[200px]">
              {[...galleryPhotos].reverse().map((photo) => (
                <motion.div
                  key={photo.id}
                  className="absolute left-1/2 top-0 -translate-x-1/2"
                  style={{ zIndex: photo.zIndex }}
                  variants={photoVariants}
                  custom={{
                    x: photo.x,
                    y: photo.y,
                    order: photo.order,
                  }}
                >
                  <InteractivePhoto
                    width={200}
                    height={200}
                    src={photo.src}
                    alt={photo.alt}
                    direction={photo.direction}
                    onClick={() => onPhotoClick(photo)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      <div className="flex w-full justify-center mt-6 lg:mt-8">
        <Button onClick={() => onPhotoClick(displayPhotos[2])}>
          Ver Todas las Fotos
        </Button>
      </div>
    </div>
  );
};

function getRandomNumberInRange(min: number, max: number): number {
  if (min >= max) {
    throw new Error("Min value should be less than max value");
  }
  return Math.random() * (max - min) + min;
}

type Direction = "left" | "right";

interface InteractivePhotoProps {
  src: string;
  alt: string;
  className?: string;
  direction?: Direction;
  width: number;
  height: number;
  enableDrag?: boolean;
  onClick: () => void;
}

export const InteractivePhoto = ({
  src,
  alt,
  className,
  direction,
  width,
  height,
  enableDrag = true,
  onClick,
}: InteractivePhotoProps) => {
  const [rotation, setRotation] = useState<number>(0);
  const x = useMotionValue(200);
  const y = useMotionValue(200);

  useEffect(() => {
    const randomRotation =
      getRandomNumberInRange(1, 4) * (direction === "left" ? -1 : 1);
    setRotation(randomRotation);
  }, [direction]);

  function handleMouse(event: {
    currentTarget: { getBoundingClientRect: () => any };
    clientX: number;
    clientY: number;
  }) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);
  }

  const resetMouse = () => {
    x.set(200);
    y.set(200);
  };

  return (
    <motion.div
      drag={enableDrag}
      dragConstraints={
        enableDrag ? { left: 0, right: 0, top: 0, bottom: 0 } : undefined
      }
      whileTap={{ scale: 1.2, zIndex: 40 }}
      whileHover={{
        scale: 1.1,
        rotateZ: 2 * (direction === "left" ? -1 : 1),
        zIndex: 40,
      }}
      whileDrag={{
        scale: 1.1,
        zIndex: 40,
      }}
      initial={{ rotate: 0 }}
      animate={{ rotate: rotation }}
      style={{
        width,
        height,
        perspective: 400,
        transform: `rotate(0deg) rotateX(0deg) rotateY(0deg)`,
        zIndex: 1,
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        touchAction: enableDrag ? "none" : "pan-x pan-y",
      }}
      className={cn(
        className,
        "relative mx-auto shrink-0",
        enableDrag
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-pointer"
      )}
      onMouseMove={handleMouse}
      onMouseLeave={resetMouse}
      draggable={false}
      tabIndex={0}
      onClick={onClick}
    >
      <div className="relative h-full w-full overflow-hidden rounded-3xl shadow-lg">
        <img
          className="rounded-3xl object-cover w-full h-full"
          src={src}
          alt={alt}
          loading="lazy"
          draggable={false}
        />
      </div>
    </motion.div>
  );
};
