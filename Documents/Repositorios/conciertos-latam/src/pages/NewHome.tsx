import { useState } from 'react';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroLanding from '@/components/HeroLanding';
import { HeroCarousel } from '@/components/HeroCarousel';
import { FeatureCards } from '@/components/FeatureCards';
import { NewHomeUpcomingConcerts } from '@/components/newhome/NewHomeUpcomingConcerts';
import { NewHomeFeaturedFestivals } from '@/components/newhome/NewHomeFeaturedFestivals';
import { NewHomeFeaturedArtists } from '@/components/newhome/NewHomeFeaturedArtists';
import { NewHomeFeaturedImages } from '@/components/newhome/NewHomeFeaturedImages';
import { NewHomeSpotifyCharts } from '@/components/newhome/NewHomeSpotifyCharts';
import FeaturedVideosSection from '@/components/FeaturedVideosSection';
import { HomeSEOContent } from '@/components/newhome/HomeSEOContent';
import { motion, useScroll, useTransform } from 'framer-motion';

const NewHome = () => {
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
        "@type": "WebPage",
        "name": "Conciertos Latam - La Comunidad de Conciertos en Vivo",
        "description": "La plataforma líder de conciertos y eventos musicales de América Latina. Descubre conciertos, festivales, setlists y conecta con otros fans.",
        "url": "https://www.conciertoslatam.app/",
        "publisher": {
            "@type": "Organization",
            "name": "Conciertos Latam"
        }
    };

    return (
        <>
            <SEO
                title="Conciertos y Festivales en Latinoamérica 2026 | Calendario, Entradas y Setlists"
                description="Encuentra todos los conciertos y festivales en América Latina 2026. Calendario actualizado, precios de entradas, setlists, venues y comunidad de fans en Colombia, México, Argentina, Chile y más. Tu guía #1 de música en vivo."
                keywords="conciertos 2026, conciertos latinoamérica, calendario conciertos, festivales latam, cuando es el concierto de, entradas conciertos, boletas, tickets, setlists, conciertos en colombia, conciertos en mexico, conciertos en argentina, movistar arena, estadio nacional, tu boleta, ticketmaster latam, próximos conciertos, agenda de conciertos"
                url="/"
                structuredData={structuredData}
            />

            {/* Hero Landing - Primera interacción (exactly as in Index) */}
            <HeroLanding onScrollPastHero={setShowHeader} />

            {/* Main content with parallax reveal - No aurora background, just solid color */}
            <div className="relative z-10 mt-[100vh] bg-background">
                {/* News Headlines Carousel - Outside AuroraBackground for clean, crisp display */}
                <HeroCarousel />

                {/* Header always visible after scroll */}
                <Header visible={showHeader} />

                <motion.main className="pt-0" style={{ opacity: contentOpacity }}>
                    {/* News by Category Section */}
                    <FeatureCards />

                    {/* Featured Artists Section with modern design and parallax scroll reveal */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <NewHomeFeaturedArtists />
                    </motion.div>

                    {/* Upcoming Concerts Section with modern design and parallax scroll reveal */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <NewHomeUpcomingConcerts />
                    </motion.div>

                    {/* Featured Festivals Section with modern design and parallax scroll reveal */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    >
                        <NewHomeFeaturedFestivals />
                    </motion.div>

                    {/* Featured Videos Section with modern design and parallax scroll reveal */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    >
                        <FeaturedVideosSection />
                    </motion.div>

                    {/* Featured Images Gallery Section with modern design and parallax scroll reveal */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    >
                        <NewHomeFeaturedImages />
                    </motion.div>

                    {/* Top 10 Conciertos LATAM Section with modern design and parallax scroll reveal */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    >
                        <NewHomeSpotifyCharts />
                    </motion.div>
                </motion.main>


                <HomeSEOContent />

                <Footer />
            </div>
        </>
    );
};

export default NewHome;
