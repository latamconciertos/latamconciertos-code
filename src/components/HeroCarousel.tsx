import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/hooks/queries';
import { formatDisplayDate } from '@/lib/timezone';

interface NewsArticle {
    id: string;
    title: string;
    slug: string;
    featured_image: string | null;
    featured_image_mobile: string | null;
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
          featured_image_mobile,
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
            return (data || []) as unknown as NewsArticle[];
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
            <section className="relative w-full h-[600px] md:h-[700px] overflow-hidden bg-noche">
                <div className="absolute inset-0 bg-superficie/60" />
                <div className="relative h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fucsia"></div>
                </div>
            </section>
        );
    }

    const currentArticle = articles[currentSlide];
    const articleHref = `/blog/${currentArticle.slug}`;

    return (
        <section className="relative w-full h-[600px] md:h-[700px] overflow-hidden group/hero">
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
                    {currentArticle.featured_image ? (
                        <>
                            <picture>
                                {currentArticle.featured_image_mobile && (
                                    <source
                                        media="(max-width: 767px)"
                                        srcSet={currentArticle.featured_image_mobile}
                                    />
                                )}
                                <img
                                    src={currentArticle.featured_image}
                                    alt={currentArticle.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover/hero:scale-[1.02]"
                                />
                            </picture>
                            {/* Overlay nocturno para que el texto respire sobre la foto */}
                            <div className="absolute inset-0 bg-noche/45" />
                            <div
                                className="absolute inset-0"
                                style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(7,13,31,.85))' }}
                            />
                        </>
                    ) : (
                        // Fallback cuando no hay imagen: superficie con glow morado
                        <div className="absolute inset-0 bg-superficie">
                            <div
                                className="absolute left-1/2 top-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                                style={{ background: 'radial-gradient(closest-side, rgba(117,22,226,.45), transparent 70%)', filter: 'blur(110px)' }}
                            />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Full-area click target — covers the whole hero so tapping anywhere
                (image, dark overlay, even on top of text) navigates to the article.
                Sits at z-10. Arrows and dots use z-20 to stay above and capture their own clicks. */}
            <Link
                to={articleHref}
                aria-label={`Leer: ${currentArticle.title}`}
                className="absolute inset-0 z-10 cursor-pointer"
            />

            {/* Navigation Arrows — above the click overlay */}
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

            {/* Slides Container — text/CTA visual layer.
                pointer-events-none so it doesn't block the click overlay underneath;
                inner button re-enables pointer-events. */}
            <div className="absolute inset-0 flex items-center justify-center px-4 md:px-16 lg:px-24 z-10 pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                        className="text-center max-w-4xl"
                    >
                        {currentArticle.categories && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="mb-5"
                            >
                                <span className="inline-flex items-center rounded-full border border-naranja/30 bg-noche/70 backdrop-blur-sm px-3.5 py-1.5 font-fira text-[11px] font-bold uppercase tracking-[0.14em] text-naranja">
                                    {currentArticle.categories.name}
                                </span>
                            </motion.div>
                        )}

                        <motion.h1
                            className="font-display font-extrabold uppercase tracking-[0.01em] text-4xl md:text-6xl lg:text-7xl text-texto mb-6 leading-[0.95]"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                        >
                            {currentArticle.title}
                        </motion.h1>

                        {currentArticle.meta_description && (
                            <motion.p
                                className="font-fira text-base md:text-lg text-texto/85 mb-8 leading-relaxed max-w-2xl mx-auto line-clamp-3"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.6 }}
                            >
                                {currentArticle.meta_description}
                            </motion.p>
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="pointer-events-auto inline-block"
                        >
                            <Link
                                to={articleHref}
                                className="btn-nocturno px-8 text-base md:text-lg group/cta"
                            >
                                Leer historia
                                <ChevronRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" />
                            </Link>
                        </motion.div>

                        <motion.p
                            className="font-fira text-sm text-texto-2 mt-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            {formatDisplayDate(currentArticle.published_at)}
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
                                ? 'w-8 bg-fucsia'
                                : 'w-2 bg-white/40 hover:bg-white/60'
                            }`}
                        aria-label={`Ir a noticia ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};
