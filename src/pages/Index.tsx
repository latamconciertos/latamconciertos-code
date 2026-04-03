import { useState, lazy, Suspense } from 'react';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import HeroLanding from '@/components/HeroLanding';
import Footer from '@/components/Footer';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { SpotifyCharts } from '@/components/SpotifyCharts';
import { motion, useScroll, useTransform } from 'framer-motion';

// Critical components - load immediately
import FeaturedArtistsMobile from '@/components/FeaturedArtistsMobile';
import UpcomingConcertsSection from '@/components/UpcomingConcertsSection';
import FeaturedConcertsSection from '@/components/FeaturedConcertsSection';
import FeaturedFestivalsSection from '@/components/FeaturedFestivalsSection';

// Below-fold components - lazy load for better performance
const FeaturedVideosSection = lazy(() => import('@/components/FeaturedVideosSection'));
const ImageAutoSlider = lazy(() => import('@/components/ui/image-auto-slider'));
const LatestNewsSection = lazy(() => import('@/components/LatestNewsSection'));
const AnnouncementsSection = lazy(() => import('@/components/AnnouncementsSection'));
const AdSpacesSection = lazy(() => import('@/components/AdSpacesSection'));

// Skeleton loading component for lazy sections
const SectionSkeleton = () => (
  <div className="w-full py-8 animate-pulse">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="h-8 bg-muted/20 rounded w-48 mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 bg-muted/20 rounded-lg"></div>
        ))}
      </div>
    </div>
  </div>
);

const Index = () => {
  const [showHeader, setShowHeader] = useState(false);

  // Scroll-based fade-in for main content
  const { scrollY } = useScroll();
  const contentOpacity = useTransform(
    scrollY,
    [typeof window !== 'undefined' ? window.innerHeight * 0.5 : 400, typeof window !== 'undefined' ? window.innerHeight : 800],
    [0, 1]
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Conciertos Latam",
    "alternateName": "Conciertos América Latina",
    "url": "https://www.conciertoslatam.app",
    "description": "La plataforma líder de conciertos y eventos musicales de América Latina. Encuentra artistas, venues, setlists y noticias.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://www.conciertoslatam.app/concerts?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Conciertos Latam",
      "logo": {
        "@type": "ImageObject",
        "url": "https://storage.googleapis.com/gpt-engineer-file-uploads/Z29vckhx3OX2dJbEXJylHmg3SB23/social-images/social-1757981020072-Logo Principal transparente.png"
      }
    }
  };

  try {
    return (
      <>
        <SEO
          title="Conciertos en América Latina - Próximos Eventos y Shows Musicales"
          description="Descubre los mejores conciertos y eventos musicales en toda América Latina. Encuentra fechas, lugares, artistas y compra tus entradas."
          keywords="conciertos, eventos musicales, shows en vivo, América Latina, entradas conciertos, próximos conciertos"
          url="/"
          structuredData={structuredData}
        />

        {/* Hero Landing - Primera interacción */}
        <HeroLanding onScrollPastHero={setShowHeader} />

        {/* Main content with parallax reveal */}
        <div className="relative z-10 mt-[100vh]">
          <AuroraBackground>
            <Header visible={showHeader} />
            <motion.main className="pt-0" style={{ opacity: contentOpacity }}>
              {/* Critical components - load immediately */}
              <Hero />
              <FeaturedArtistsMobile />

              {/* Priority business content - upcoming events */}
              <UpcomingConcertsSection />
              <FeaturedFestivalsSection />

              {/* Below-fold components - lazy load with Suspense */}
              <Suspense fallback={<SectionSkeleton />}>
                <FeaturedVideosSection />
              </Suspense>

              <Suspense fallback={<SectionSkeleton />}>
                <ImageAutoSlider />
              </Suspense>

              <Suspense fallback={<SectionSkeleton />}>
                <LatestNewsSection />
              </Suspense>

              <Suspense fallback={<SectionSkeleton />}>
                <AnnouncementsSection />
              </Suspense>

              <Suspense fallback={<SectionSkeleton />}>
                <AdSpacesSection />
              </Suspense>


              {/* SpotifyCharts - normal import (uses named export) */}
              <SpotifyCharts />

              {/* Featured concerts section */}
              <FeaturedConcertsSection />
            </motion.main>
            <Footer />
          </AuroraBackground>
        </div>
      </>
    );
  } catch {
    return <div>Error loading page</div>;
  }
};

export default Index;
