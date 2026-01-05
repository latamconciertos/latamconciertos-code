import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/hooks/queries';
import { formatDisplayDate } from '@/lib/timezone';
import { Badge } from './ui/badge';

interface NewsArticle {
    id: string;
    title: string;
    slug: string;
    featured_image: string | null;
    published_at: string;
    meta_description: string | null;
    categories: {
        name: string;
        slug: string;
    } | null;
}

export const HeroCarousel = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Fetch latest news articles for carousel
    const { data: articles = [], isLoading } = useQuery({
        queryKey: [...queryKeys.news.all, 'carousel-headlines'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('news_articles')
                .select(`
          id,
          title,
          slug,
          featured_image,
          published_at,
          meta_description,
          categories:category_id (
            name,
            slug
          )
        `)
                .eq('status', 'published')
                .order('published_at', { ascending: false })
                .limit(6);

            if (error) throw error;
            return (data || []) as NewsArticle[];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % articles.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + articles.length) % articles.length);
    };

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
    };

    useEffect(() => {
        if (articles.length === 0) return;

        const interval = setInterval(() => {
            nextSlide();
        }, 5000);

        return () => clearInterval(interval);
    }, [currentSlide, articles.length]);

    if (isLoading || articles.length === 0) {
        return (
            <section className="relative w-full h-[600px] md:h-[700px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#004aad] via-[#0062cc] to-[#6b7280] opacity-90" />
                <div className="relative h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
            </section>
        );
    }

    return (
        <section className="relative w-full h-[600px] md:h-[700px] overflow-hidden">
            {/* Background image with minimal overlay for text readability */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                >
                    {articles[currentSlide].featured_image ? (
                        <>
                            <img
                                src={articles[currentSlide].featured_image}
                                alt={articles[currentSlide].title}
                                className="w-full h-full object-cover"
                            />
                            {/* Dark overlay across entire image for text readability */}
                            <div className="absolute inset-0 bg-black/50" />
                            {/* Additional gradient at bottom for extra emphasis */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </>
                    ) : (
                        // Fallback gradient when no image
                        <div className="absolute inset-0 bg-gradient-to-br from-[#004aad] via-[#0062cc] to-[#6b7280]" />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 md:p-4 rounded-full transition-all duration-300 hover:scale-110"
                aria-label="Noticia anterior"
            >
                <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
            </button>

            <button
                onClick={nextSlide}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 md:p-4 rounded-full transition-all duration-300 hover:scale-110"
                aria-label="Siguiente noticia"
            >
                <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
            </button>

            {/* Slides Container */}
            <div className="relative h-full flex items-center justify-center px-4 md:px-16 lg:px-24 z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                        className="text-center max-w-4xl"
                    >
                        {articles[currentSlide].categories && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="mb-4"
                            >
                                <Badge className="bg-primary text-primary-foreground font-bold">
                                    {articles[currentSlide].categories.name}
                                </Badge>
                            </motion.div>
                        )}

                        <motion.h1
                            className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 font-fira leading-tight"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                        >
                            {articles[currentSlide].title}
                        </motion.h1>

                        {articles[currentSlide].meta_description && (
                            <motion.p
                                className="text-base md:text-xl text-white/90 mb-8 leading-relaxed max-w-2xl mx-auto line-clamp-3"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                            >
                                {articles[currentSlide].meta_description}
                            </motion.p>
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                        >
                            <Link
                                to={`/blog/${articles[currentSlide].slug}`}
                                className="inline-block bg-white text-primary hover:bg-white/90 font-semibold px-8 py-3 md:py-4 text-base md:text-lg rounded-lg transition-all hover:scale-105"
                            >
                                LEER MÁS
                            </Link>
                        </motion.div>

                        <motion.p
                            className="text-sm text-white/70 mt-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            {formatDisplayDate(articles[currentSlide].published_at)}
                        </motion.p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Dots Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {articles.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`h-2 rounded-full transition-all min-h-0 min-w-0 ${index === currentSlide
                                ? 'w-8 bg-white'
                                : 'w-2 bg-white/50 hover:bg-white/70'
                            }`}
                        aria-label={`Ir a noticia ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};
