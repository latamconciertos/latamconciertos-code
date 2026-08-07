import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { formatShortDate } from '@/lib/timezone';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { SectionHeader } from './newhome/SectionHeader';

interface NewsArticle {
    id: string;
    title: string;
    slug: string;
    featured_image: string | null;
    published_at: string;
    meta_description: string | null;
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

export const FeatureCards = () => {
    // State for mobile accordion - track expanded state for each category
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
    // Fetch categories
    const { data: categories = [] } = useQuery({
        queryKey: ['categories', 'all'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name')
                .limit(3);

            if (error) throw error;
            return (data || []) as Category[];
        },
    });

    // Fetch recent articles for each category
    const { data: categoriesWithArticles = [], isLoading } = useQuery({
        queryKey: ['categories-with-articles', categories.map(c => c.id)],
        queryFn: async () => {
            if (categories.length === 0) return [];

            const results = await Promise.all(
                categories.map(async (category) => {
                    const { data, error } = await supabase
                        .from('news_articles')
                        .select(`
              id,
              title,
              slug,
              featured_image,
              published_at,
              meta_description
            `)
                        .eq('status', 'published')
                        .eq('category_id', category.id)
                        .order('published_at', { ascending: false })
                        .limit(3);

                    if (error) {
                        console.error(`Error fetching articles for category ${category.name}:`, error);
                        return {
                            ...category,
                            articles: []
                        };
                    }

                    return {
                        ...category,
                        articles: (data || []) as NewsArticle[]
                    };
                })
            );

            return results;
        },
        enabled: categories.length > 0,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const toggleCard = (categoryId: string) => {
        setExpandedCards(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    if (isLoading || categoriesWithArticles.length === 0) {
        return (
            <section className="w-full py-12 md:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-periwinkle mx-auto"></div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full py-12 md:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <SectionHeader
                    eyebrow="Noticias"
                    title="Las historias detrás de cada show"
                    subtitle="Lo que está pasando en el mundo de la música en vivo."
                    action={{ label: 'Ver todas las noticias', to: '/blog' }}
                />

                {/* Category Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {categoriesWithArticles.map((category, index) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                        >
                            <Card className="h-full rounded-[20px] border-linea bg-superficie hover:border-[rgba(89,124,255,.35)] hover:shadow-[0_20px_50px_rgba(0,0,0,.5)] transition-all duration-300">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <CardTitle className="font-display text-2xl font-extrabold uppercase tracking-[0.01em] text-texto">
                                            {category.name}
                                        </CardTitle>
                                        {/* Mobile toggle button */}
                                        <button
                                            onClick={() => toggleCard(category.id)}
                                            className="md:hidden p-2 hover:bg-superficie-2 rounded-full transition-colors"
                                            aria-label={expandedCards[category.id] ? "Colapsar" : "Expandir"}
                                        >
                                            {expandedCards[category.id] ? (
                                                <ChevronUp className="h-5 w-5 text-periwinkle" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-periwinkle" />
                                            )}
                                        </button>
                                    </div>
                                    <CardDescription className="text-base">
                                        {category.articles.length} {category.articles.length === 1 ? 'noticia reciente' : 'noticias recientes'}
                                    </CardDescription>
                                </CardHeader>

                                {/* Content - Collapsible on mobile, always visible on desktop */}
                                <div className="md:block">
                                    {/* Mobile: Collapsible */}
                                    <AnimatePresence>
                                        {expandedCards[category.id] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                className="md:hidden overflow-hidden"
                                            >
                                                <CardContent className="space-y-4">
                                                    {category.articles.length > 0 ? (
                                                        <>
                                                            {/* Featured article (first one) */}
                                                            <Link
                                                                to={`/blog/${category.articles[0].slug}`}
                                                                className="block group"
                                                            >
                                                                {category.articles[0].featured_image && (
                                                                    <div className="relative h-48 overflow-hidden rounded-lg mb-3 bg-muted">
                                                                        <img
                                                                            src={category.articles[0].featured_image}
                                                                            alt={category.articles[0].title}
                                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                            loading="lazy"
                                                                        />
                                                                        <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                                                                    </div>
                                                                )}
                                                                <h3 className="font-bold text-base text-foreground leading-tight line-clamp-2 group-hover:text-periwinkle transition-colors mb-2">
                                                                    {category.articles[0].title}
                                                                </h3>
                                                                {category.articles[0].meta_description && (
                                                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                                        {category.articles[0].meta_description}
                                                                    </p>
                                                                )}
                                                                <p className="text-xs text-muted-foreground">
                                                                    {formatShortDate(category.articles[0].published_at)}
                                                                </p>
                                                            </Link>

                                                            {/* Other articles */}
                                                            {category.articles.slice(1).map((article) => (
                                                                <Link
                                                                    key={article.id}
                                                                    to={`/blog/${article.slug}`}
                                                                    className="block group border-t border-border pt-3"
                                                                >
                                                                    <h4 className="font-semibold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-periwinkle transition-colors mb-1">
                                                                        {article.title}
                                                                    </h4>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {formatShortDate(article.published_at)}
                                                                    </p>
                                                                </Link>
                                                            ))}

                                                            {/* View all link */}
                                                            <Link
                                                                to={`/blog?category=${category.slug}`}
                                                                className="flex items-center gap-2 text-sm font-semibold text-periwinkle hover:text-azul-claro transition-colors pt-2"
                                                            >
                                                                Ver todas en {category.name}
                                                                <ArrowRight className="h-4 w-4" />
                                                            </Link>
                                                        </>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground italic">
                                                            No hay noticias disponibles en esta categoría
                                                        </p>
                                                    )}
                                                </CardContent>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Desktop: Always visible */}
                                    <div className="hidden md:block">
                                        <CardContent className="space-y-4">
                                            {category.articles.length > 0 ? (
                                                <>
                                                    {/* Featured article (first one) */}
                                                    <Link
                                                        to={`/blog/${category.articles[0].slug}`}
                                                        className="block group"
                                                    >
                                                        {category.articles[0].featured_image && (
                                                            <div className="relative h-48 overflow-hidden rounded-lg mb-3 bg-muted">
                                                                <img
                                                                    src={category.articles[0].featured_image}
                                                                    alt={category.articles[0].title}
                                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                    loading="lazy"
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                                                            </div>
                                                        )}
                                                        <h3 className="font-bold text-base text-foreground leading-tight line-clamp-2 group-hover:text-periwinkle transition-colors mb-2">
                                                            {category.articles[0].title}
                                                        </h3>
                                                        {category.articles[0].meta_description && (
                                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                                {category.articles[0].meta_description}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatShortDate(category.articles[0].published_at)}
                                                        </p>
                                                    </Link>

                                                    {/* Other articles */}
                                                    {category.articles.slice(1).map((article) => (
                                                        <Link
                                                            key={article.id}
                                                            to={`/blog/${article.slug}`}
                                                            className="block group border-t border-border pt-3"
                                                        >
                                                            <h4 className="font-semibold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-periwinkle transition-colors mb-1">
                                                                {article.title}
                                                            </h4>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatShortDate(article.published_at)}
                                                            </p>
                                                        </Link>
                                                    ))}

                                                    {/* View all link */}
                                                    <Link
                                                        to={`/blog?category=${category.slug}`}
                                                        className="flex items-center gap-2 text-sm font-semibold text-periwinkle hover:text-azul-claro transition-colors pt-2"
                                                    >
                                                        Ver todas en {category.name}
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Link>
                                                </>
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">
                                                    No hay noticias disponibles en esta categoría
                                                </p>
                                            )}
                                        </CardContent>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
};
