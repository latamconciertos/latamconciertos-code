import { useState, useMemo } from 'react';
import { Search, Calendar, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useBlogArticles, useBlogCategories, type BlogArticle } from '@/hooks/queries';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';

const SITE_URL = 'https://www.conciertoslatam.app';
const LOGO_URL = 'https://storage.googleapis.com/gpt-engineer-file-uploads/Z29vckhx3OX2dJbEXJylHmg3SB23/social-images/social-1757981020072-Logo Principal transparente.png';

const stripHtml = (html: string | null | undefined) =>
  (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const getReadingTime = (content: string | null | undefined) => {
  const text = stripHtml(content);
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200));
};

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  const { data: articles = [], isLoading: loadingArticles } = useBlogArticles();
  const { data: categories = [], isLoading: loadingCategories } = useBlogCategories();

  const getCategoryById = (id: string | null) => categories.find((c) => c.id === id);
  const getCategorySlugForArticle = (article: BlogArticle) => getCategoryById(article.category_id)?.slug;

  const handleClearAllFilters = () => {
    setSelectedCategory('all');
    setSortBy('newest');
    setSearchTerm('');
  };

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (article.content || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || getCategorySlugForArticle(article) === selectedCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime();
      } else {
        return new Date(a.published_at || a.created_at).getTime() - new Date(b.published_at || b.created_at).getTime();
      }
    });
  }, [articles, categories, searchTerm, selectedCategory, sortBy]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDefaultImage = () => "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop";

  const getArticleImage = (article: BlogArticle) => {
    if (article.featured_image) return article.featured_image;
    if (article.artists?.photo_url) return article.artists.photo_url;
    return getDefaultImage();
  };

  const loading = loadingArticles || loadingCategories;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <LoadingSpinnerInline message="Cargando artículos..." />
        </main>
        <Footer />
      </div>
    );
  }

  const filterCategoryName = selectedCategory !== 'all'
    ? categories.find((c) => c.slug === selectedCategory)?.name
    : null;

  const blogUrl = filterCategoryName
    ? `${SITE_URL}/blog?category=${selectedCategory}`
    : `${SITE_URL}/blog`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${blogUrl}#blog`,
    "name": filterCategoryName
      ? `${filterCategoryName} | Noticias Conciertos Latam`
      : "Noticias Musicales Conciertos Latam",
    "description": filterCategoryName
      ? `Cobertura editorial de ${filterCategoryName.toLowerCase()} en la escena musical de América Latina.`
      : "Noticias, entrevistas exclusivas y análisis profundos sobre la escena musical latinoamericana.",
    "url": blogUrl,
    "inLanguage": "es-419",
    "isPartOf": { "@id": `${SITE_URL}/#website` },
    "publisher": {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      "name": "Conciertos Latam",
      "logo": {
        "@type": "ImageObject",
        "url": LOGO_URL,
      },
    },
    "blogPost": filteredArticles.slice(0, 10).map((article) => {
      const description = article.meta_description || stripHtml(article.content).slice(0, 160);
      return {
        "@type": "BlogPosting",
        "headline": article.title,
        "description": description,
        "image": getArticleImage(article),
        "datePublished": article.published_at || article.created_at,
        "dateModified": article.published_at || article.created_at,
        "inLanguage": "es-419",
        "wordCount": stripHtml(article.content).split(/\s+/).filter(Boolean).length,
        "articleSection": article.categories?.name,
        "author": {
          "@type": "Organization",
          "name": "Conciertos Latam",
          "url": SITE_URL,
        },
        "publisher": {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          "name": "Conciertos Latam",
          "logo": { "@type": "ImageObject", "url": LOGO_URL },
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `${SITE_URL}/blog/${article.slug}`,
        },
        "url": `${SITE_URL}/blog/${article.slug}`,
      };
    }),
  };

  const featuredArticle = filteredArticles[0];
  const restArticles = filteredArticles.slice(1);

  return (
    <>
      <SEO
        title={
          filterCategoryName
            ? `${filterCategoryName} · Noticias Musicales LATAM`
            : `Noticias Musicales · Entrevistas, conciertos y cultura latina${filteredArticles.length ? ` · ${filteredArticles.length} historias` : ''}`
        }
        description={
          filterCategoryName
            ? `Cobertura editorial de ${filterCategoryName.toLowerCase()} en la escena musical latinoamericana. Reportajes, entrevistas y novedades.`
            : 'Las últimas noticias, entrevistas exclusivas, reportajes y análisis de la escena musical latinoamericana. Conciertos, festivales y artistas en un solo lugar.'
        }
        keywords={
          filterCategoryName
            ? `${filterCategoryName.toLowerCase()}, noticias ${filterCategoryName.toLowerCase()}, música latina, América Latina`
            : 'noticias musicales, entrevistas artistas, música latina, reportajes, análisis musical, América Latina, conciertos, festivales, shows en vivo'
        }
        url="/blog"
        type="website"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-28 pb-8">
        <Breadcrumbs items={[
          { label: 'Noticias' }
        ]} />

        {/* Editorial Hero */}
        <header className="text-center mt-6 mb-10 md:mb-14">
          <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.22em] text-primary mb-3">
            La revista de música latina
          </p>
          <h1 className="font-display uppercase text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[-0.015em] leading-[0.92] text-foreground text-balance mb-4">
            Noticias
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Entrevistas, reportajes y la cobertura editorial completa de la escena musical en América Latina.
          </p>
          {(articles.length > 0 || categories.length > 0) && (
            <div className="flex flex-wrap justify-center gap-x-10 md:gap-x-14 gap-y-4 mt-8 md:mt-10">
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="font-display text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none">
                  {articles.length}
                </span>
                <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-1.5">
                  Historias
                </span>
              </div>
              {categories.length > 0 && (
                <div className="flex flex-col items-center min-w-[80px]">
                  <span className="font-display text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none">
                    {categories.length}
                  </span>
                  <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-1.5">
                    Categorías
                  </span>
                </div>
              )}
            </div>
          )}
        </header>

        {/* Editorial filter bar */}
        <div className="mb-8 md:mb-10">
          {/* Row 1: search + sort */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar artículos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 text-sm pl-11 rounded-full bg-card border-border/60 focus-visible:ring-primary/30"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-11 w-auto min-w-[140px] sm:min-w-[160px] rounded-full bg-card border-border/60 text-xs font-semibold uppercase tracking-[0.12em]">
                <Clock className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Más reciente</SelectItem>
                <SelectItem value="oldest">Más antiguo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Row 2: category tab bar — editorial pattern */}
          <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0">
            <div className="flex items-center gap-1 sm:gap-2 min-w-max sm:min-w-0 sm:justify-center px-4 sm:px-0 border-b border-border/60">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`relative px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] transition-colors whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-pressed={selectedCategory === 'all'}
              >
                Todas
                <span
                  className={`absolute left-0 right-0 -bottom-px h-0.5 transition-colors ${
                    selectedCategory === 'all' ? 'bg-primary' : 'bg-transparent'
                  }`}
                  aria-hidden="true"
                />
              </button>
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`relative px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    aria-pressed={isActive}
                  >
                    {cat.name}
                    <span
                      className={`absolute left-0 right-0 -bottom-px h-0.5 transition-colors ${
                        isActive ? 'bg-primary' : 'bg-transparent'
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active filters / count */}
          <div className="flex items-center justify-between mt-5">
            <p className="text-xs text-muted-foreground">
              {filteredArticles.length} {filteredArticles.length === 1 ? 'historia' : 'historias'}
              {selectedCategory !== 'all' && filterCategoryName && (
                <span> en <span className="text-foreground font-semibold">{filterCategoryName}</span></span>
              )}
            </p>
            {(selectedCategory !== 'all' || sortBy !== 'newest' || searchTerm) && (
              <button
                onClick={handleClearAllFilters}
                className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Articles */}
        {filteredArticles.length > 0 ? (
          <>
            {/* Featured — first article as a magazine cover */}
            {featuredArticle && (
              <a
                href={`/blog/${featuredArticle.slug}`}
                className="group block mb-12 md:mb-16"
              >
                <div className="grid md:grid-cols-12 gap-6 md:gap-10 items-center">
                  <div className="md:col-span-7">
                    <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-muted ring-1 ring-border/40">
                      <img
                        src={getArticleImage(featuredArticle)}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        loading="eager"
                        decoding="async"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-5">
                    <div className="flex items-center gap-3 mb-3 md:mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                        {getCategoryById(featuredArticle.category_id)?.name || 'Noticias'}
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-xs text-muted-foreground">Destacado</span>
                    </div>
                    <h2 className="font-display uppercase text-3xl md:text-4xl lg:text-5xl font-black tracking-[-0.01em] leading-[0.95] text-foreground text-balance mb-4 md:mb-5 group-hover:text-primary transition-colors">
                      {featuredArticle.title}
                    </h2>
                    {(featuredArticle.meta_description || featuredArticle.content) && (
                      <p className="text-base md:text-lg text-muted-foreground leading-relaxed line-clamp-3 mb-5">
                        {featuredArticle.meta_description || stripHtml(featuredArticle.content).slice(0, 200)}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <time dateTime={featuredArticle.published_at || featuredArticle.created_at}>
                        {formatDate(featuredArticle.published_at || featuredArticle.created_at)}
                      </time>
                      {getReadingTime(featuredArticle.content) > 0 && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span>{getReadingTime(featuredArticle.content)} min de lectura</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            )}

            {/* Rest of the grid */}
            {restArticles.length > 0 && (
              <>
                <div className="flex items-center gap-3 mb-6 md:mb-8 pt-2">
                  <span className="h-px flex-1 bg-border/60" aria-hidden="true" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {filterCategoryName ? `Más en ${filterCategoryName}` : 'Más historias'}
                  </p>
                  <span className="h-px flex-1 bg-border/60" aria-hidden="true" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {restArticles.map((article) => {
                    const readTime = getReadingTime(article.content);
                    return (
                      <a
                        key={article.id}
                        href={`/blog/${article.slug}`}
                        className="group block focus:outline-none"
                      >
                        <Card className="overflow-hidden border-border/60 bg-card hover:border-primary/30 hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                          <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                            <img
                              src={getArticleImage(article)}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>

                          <CardContent className="p-5 flex-1 flex flex-col">
                            {getCategoryById(article.category_id) && (
                              <span className="inline-block text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-2">
                                {getCategoryById(article.category_id)?.name}
                              </span>
                            )}
                            <h3 className="font-bold text-base md:text-lg text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-3 leading-snug">
                              {article.title}
                            </h3>
                            {article.meta_description && (
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                                {article.meta_description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                              <Calendar className="h-3 w-3" />
                              <time dateTime={article.published_at || article.created_at}>
                                {formatDate(article.published_at || article.created_at)}
                              </time>
                              {readTime > 0 && (
                                <>
                                  <span className="text-muted-foreground/40">·</span>
                                  <span>{readTime} min</span>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </a>
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No se encontraron artículos</h3>
            <p className="text-sm text-muted-foreground">
              Intenta ajustar tus filtros de búsqueda
            </p>
          </div>
        )}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Blog;
