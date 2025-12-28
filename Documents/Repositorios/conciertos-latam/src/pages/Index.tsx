import { useState } from 'react';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import HeroLanding from '@/components/HeroLanding';
import FeaturedVideosSection from '@/components/FeaturedVideosSection';
import FeaturedPhotosSection from '@/components/FeaturedPhotosSection';
import LatestNewsSection from '@/components/LatestNewsSection';
import AnnouncementsSection from '@/components/AnnouncementsSection';
import AdSpacesSection from '@/components/AdSpacesSection';
import UpcomingConcertsSection from '@/components/UpcomingConcertsSection';
import FeaturedConcertsSection from '@/components/FeaturedConcertsSection';
import FeaturedFestivalsSection from '@/components/FeaturedFestivalsSection';
import FeaturedArtistsMobile from '@/components/FeaturedArtistsMobile';
import RecommendedNewsSection from '@/components/RecommendedNewsSection';
import { SpotifyCharts } from '@/components/SpotifyCharts';
import Footer from '@/components/Footer';
import { AuroraBackground } from '@/components/ui/aurora-background';

const Index = () => {
  const [showHeader, setShowHeader] = useState(false);
  
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
        <div className="relative z-10">
          <AuroraBackground>
            <Header visible={showHeader} />
            <main className="pt-0">
              <Hero />
              <FeaturedArtistsMobile />
              <FeaturedVideosSection />
              <FeaturedPhotosSection />
              <LatestNewsSection />
              <AnnouncementsSection />
              <AdSpacesSection />
              <SpotifyCharts />
              <UpcomingConcertsSection />
              <FeaturedFestivalsSection />
              <FeaturedConcertsSection />
              <RecommendedNewsSection />
            </main>
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
