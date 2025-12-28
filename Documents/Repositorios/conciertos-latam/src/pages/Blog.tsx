import { useState, useMemo } from 'react';
import { Search, Calendar, Tag, Clock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useBlogArticles, useBlogCategories, type BlogArticle, type BlogCategory } from '@/hooks/queries';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { MobileFiltersSheet, ActiveFiltersChips, FilterLabel, type ActiveFilter } from '@/components/filters';
import { useIsMobile } from '@/hooks/use-mobile';

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  const isMobile = useIsMobile();

  const { data: articles = [], isLoading: loadingArticles } = useBlogArticles();
  const { data: categories = [], isLoading: loadingCategories } = useBlogCategories();

  const getCategoryById = (id: string | null) => categories.find((c) => c.id === id);
  const getCategorySlugForArticle = (article: BlogArticle) => getCategoryById(article.category_id)?.slug;

  // Active filters for mobile
  const getActiveFilters = (): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];
    if (selectedCategory !== 'all') {
      const category = categories.find(c => c.slug === selectedCategory);
      if (category) filters.push({ key: 'category', label: category.name, value: selectedCategory });
    }
    if (sortBy !== 'newest') {
      filters.push({ key: 'sort', label: 'Más antiguo', value: sortBy });
    }
    return filters;
  };

  const handleRemoveFilter = (key: string) => {
    if (key === 'category') setSelectedCategory('all');
    if (key === 'sort') setSortBy('newest');
  };

  const handleClearAllFilters = () => {
    setSelectedCategory('all');
    setSortBy('newest');
    setSearchTerm('');
  };

  const activeFilters = getActiveFilters();

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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Noticias Musicales Conciertos Latam",
    "description": "Noticias, entrevistas exclusivas y análisis profundos sobre la escena musical latinoamericana",
    "url": "https://www.conciertoslatam.app/blog",
    "inLanguage": "es-LA",
    "publisher": {
      "@type": "Organization",
      "name": "Conciertos Latam",
      "logo": {
        "@type": "ImageObject",
        "url": "https://storage.googleapis.com/gpt-engineer-file-uploads/Z29vckhx3OX2dJbEXJylHmg3SB23/social-images/social-1757981020072-Logo Principal transparente.png"
      }
    },
    "blogPost": filteredArticles.slice(0, 10).map(article => ({
      "@type": "BlogPosting",
      "headline": article.title,
      "description": article.meta_description || article.content?.substring(0, 160),
      "image": getArticleImage(article),
      "datePublished": article.published_at || article.created_at,
      "dateModified": article.published_at || article.created_at,
      "inLanguage": "es-LA",
      "author": {
        "@type": "Person",
        "name": article.profiles?.username || "Conciertos Latam"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Conciertos Latam",
        "logo": {
          "@type": "ImageObject",
          "url": "https://storage.googleapis.com/gpt-engineer-file-uploads/Z29vckhx3OX2dJbEXJylHmg3SB23/social-images/social-1757981020072-Logo Principal transparente.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://www.conciertoslatam.app/blog/${article.slug}`
      }
    }))
  };

  return (
    <>
      <SEO 
        title="Noticias Musicales - Entrevistas y Análisis"
        description="Lee las últimas noticias, entrevistas exclusivas y análisis profundos de la escena musical latinoamericana. Mantente informado sobre los mejores conciertos y artistas de América Latina."
        keywords="noticias musicales, entrevistas artistas, música latina, análisis musical, América Latina, conciertos, shows en vivo"
        url="/blog"
        type="website"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">
        <Breadcrumbs items={[
          { label: 'Noticias' }
        ]} />
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="page-title mb-4">
            Noticias Musicales
          </h1>
          <p className="page-subtitle max-w-2xl mx-auto">
            Descubre las últimas noticias, entrevistas y análisis de la escena musical latina
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg p-4 md:p-6 mb-8 border">
          {isMobile ? (
            <div className="space-y-3">
              {/* Search always visible */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar artículos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>

              <div className="flex gap-2">
                <MobileFiltersSheet
                  activeFiltersCount={activeFilters.length}
                  onClearFilters={handleClearAllFilters}
                  title="Filtros"
                >
                  <div className="space-y-6">
                    <div>
                      <FilterLabel icon={<Tag className="h-4 w-4" />}>Categoría</FilterLabel>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las categorías</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.slug}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <FilterLabel icon={<Clock className="h-4 w-4" />}>Ordenar</FilterLabel>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Ordenar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Más reciente</SelectItem>
                          <SelectItem value="oldest">Más antiguo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </MobileFiltersSheet>
              </div>

              {/* Active Filters Chips */}
              {activeFilters.length > 0 && (
                <ActiveFiltersChips 
                  filters={activeFilters} 
                  onRemove={handleRemoveFilter} 
                />
              )}
            </div>
          ) : (
            /* Desktop Filters */
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar artículos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48 text-sm">
                  <Tag className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-40 text-sm">
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Más reciente</SelectItem>
                  <SelectItem value="oldest">Más antiguo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredArticles.length} artículo{filteredArticles.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Articles Grid */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <a 
                key={article.id} 
                href={`/blog/${article.slug}`}
                className="block"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border h-full">
                  <div className="relative overflow-hidden">
                    <img 
                      src={getArticleImage(article)} 
                      alt={article.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {getCategoryById(article.category_id) && (
                      <Badge className="absolute top-3 left-3 text-xs">
                        {getCategoryById(article.category_id)?.name}
                      </Badge>
                    )}
                  </div>
                  
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 text-base leading-6">
                      {article.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-2 text-sm leading-5">
                      {article.meta_description || article.content?.substring(0, 120) + '...'}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <User className="h-3 w-3" />
                        <span>{article.profiles?.username || 'Autor'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(article.published_at || article.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
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
