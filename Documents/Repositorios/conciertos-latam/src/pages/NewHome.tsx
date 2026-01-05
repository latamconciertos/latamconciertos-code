import { useState } from 'react';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroLanding from '@/components/HeroLanding';
import { HeroCarousel } from '@/components/HeroCarousel';
import { FeatureCards } from '@/components/FeatureCards';
import { NewHomeUpcomingConcerts } from '@/components/newhome/NewHomeUpcomingConcerts';
import { NewHomeFeaturedFestivals } from '@/components/newhome/NewHomeFeaturedFestivals';
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
        "name": "Nuevo Home - Conciertos Latam",
        "description": "Descubre la nueva experiencia de Conciertos Latam - La plataforma líder de conciertos y eventos musicales de América Latina.",
        "url": "https://www.conciertoslatam.app/nuevo-home",
        "publisher": {
            "@type": "Organization",
            "name": "Conciertos Latam"
        }
    };

    return (
        <>
            <SEO
                title="Nuevo Home - Conciertos Latam | La Comunidad Musical de América Latina"
                description="Únete a la comunidad más grande de música en vivo de Latinoamérica. Descubre conciertos, festivales y las últimas noticias musicales."
                keywords="conciertos latam, música en vivo, noticias musicales, eventos latinoamérica"
                url="/nuevo-home"
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
                </motion.main>

                <Footer />
            </div>
        </>
    );
};

export default NewHome;
