import { CheckCircle2, ExternalLink, TrendingUp, FileText, Link as LinkIcon, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Link } from 'react-router-dom';

const SEOGuide = () => {
  const seoChecklist = [
    {
      category: 'Sitemaps',
      progress: 100,
      items: [
        { done: true, text: 'Sitemap principal (index)' },
        { done: true, text: 'Sitemap de páginas estáticas' },
        { done: true, text: 'Sitemap dinámico de noticias (Google News)' },
        { done: true, text: 'Sitemap dinámico de artistas' },
        { done: true, text: 'Sitemap dinámico de conciertos' },
        { done: true, text: 'Sitemap dinámico de promotoras' },
        { done: true, text: 'Robots.txt actualizado' },
      ]
    },
    {
      category: 'Structured Data (Schema.org)',
      progress: 100,
      items: [
        { done: true, text: 'NewsArticle en artículos de blog' },
        { done: true, text: 'MusicGroup en páginas de artistas' },
        { done: true, text: 'MusicEvent en conciertos' },
        { done: true, text: 'Organization en promotoras' },
        { done: true, text: 'BreadcrumbList en todas las páginas' },
        { done: true, text: 'ItemList en páginas de listado' },
      ]
    },
    {
      category: 'Meta Tags Optimizados',
      progress: 100,
      items: [
        { done: true, text: 'Títulos únicos y descriptivos' },
        { done: true, text: 'Meta descriptions optimizadas' },
        { done: true, text: 'Keywords relevantes' },
        { done: true, text: 'Open Graph completo' },
        { done: true, text: 'Twitter Cards' },
        { done: true, text: 'Canonical URLs' },
        { done: true, text: 'Imágenes sociales (1200x630)' },
      ]
    },
    {
      category: 'Google News',
      progress: 100,
      items: [
        { done: true, text: 'Sitemap de noticias con últimas 48 horas' },
        { done: true, text: 'Meta tags específicos de Google News' },
        { done: true, text: 'Información clara de publicación' },
        { done: true, text: 'Keywords en artículos' },
        { done: true, text: 'Structured data NewsArticle' },
      ]
    },
    {
      category: 'Próximos Pasos',
      progress: 0,
      items: [
        { done: false, text: 'Verificar sitio en Google Search Console' },
        { done: false, text: 'Enviar todos los sitemaps a GSC' },
        { done: false, text: 'Solicitar inclusión en Google News' },
        { done: false, text: 'Configurar Bing Webmaster Tools' },
        { done: false, text: 'Monitorear métricas de indexación' },
      ]
    }
  ];

  const resources = [
    {
      title: 'Google Search Console',
      description: 'Herramienta principal para monitorear tu presencia en Google',
      icon: TrendingUp,
      link: 'https://search.google.com/search-console',
      internal: false
    },
    {
      title: 'Guía de Configuración GSC',
      description: 'Paso a paso para configurar Google Search Console',
      icon: FileText,
      link: '/admin/google-search-console-setup',
      internal: true
    },
    {
      title: 'Google Publisher Center',
      description: 'Solicitar inclusión en Google News',
      icon: LinkIcon,
      link: 'https://publishercenter.google.com/',
      internal: false
    },
    {
      title: 'Validador de Structured Data',
      description: 'Verifica que tu structured data sea correcta',
      icon: CheckCircle2,
      link: 'https://validator.schema.org/',
      internal: false
    }
  ];

  const totalProgress = Math.round(
    seoChecklist.reduce((acc, cat) => acc + cat.progress, 0) / seoChecklist.length
  );

  return (
    <>
      <SEO
        title="Guía SEO - Panel de Administración"
        description="Estado actual de la implementación SEO de Conciertos Latam"
        keywords="seo, google search console, sitemaps, structured data"
        url="/admin/seo-guide"
      />
      <div className="dark font-fira min-h-screen bg-noche text-texto">
        <Header />

        <main className="container mx-auto px-4 py-16">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Guía SEO' }
          ]} />

          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <span className="eyebrow-nocturno justify-center mb-4">SEO Dashboard</span>
              <h1 className="font-display uppercase tracking-[0.01em] font-extrabold text-4xl md:text-5xl leading-none text-texto mb-4">
                Estado de Optimización SEO
              </h1>
              <p className="text-xl text-texto-2 mb-6">
                Progreso de implementación técnica para maximizar la visibilidad en buscadores
              </p>

              {/* Overall Progress */}
              <Card className="max-w-2xl mx-auto rounded-[20px] border-linea bg-superficie">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Progreso General</span>
                      <span className={`font-display text-3xl font-extrabold tracking-[0.01em] ${totalProgress === 100 ? 'text-verde' : 'text-periwinkle'}`}>
                        {totalProgress}%
                      </span>
                    </div>
                    <ProgressBarNocturno value={totalProgress} className="h-3" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Checklist Categories */}
            <div className="grid gap-6 mb-12">
              {seoChecklist.map((category, idx) => (
                <Card key={idx} className="rounded-[20px] border-linea bg-superficie">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{category.category}</CardTitle>
                        <CardDescription>
                          {category.items.filter(i => i.done).length} de {category.items.length} completados
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          category.progress === 100
                            ? 'border-verde/30 bg-verde/10 text-verde'
                            : 'border-linea bg-superficie-2 text-texto-2'
                        }
                      >
                        {category.progress}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ProgressBarNocturno value={category.progress} className="h-2 mb-4" />
                    <ul className="space-y-2">
                      {category.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-center gap-2">
                          <CheckCircle2
                            className={`h-5 w-5 flex-shrink-0 ${
                              item.done ? 'text-verde' : 'text-muted-foreground'
                            }`}
                          />
                          <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>
                            {item.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Resources */}
            <div className="mb-12">
              <h2 className="font-display uppercase tracking-[0.01em] font-extrabold text-2xl text-texto mb-6">
                Recursos Útiles
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {resources.map((resource, idx) => (
                  <Card
                    key={idx}
                    className="rounded-[20px] border-linea bg-superficie transition-all hover:border-[rgba(89,124,255,.35)] hover:shadow-[0_20px_50px_rgba(0,0,0,.5)]"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-periwinkle/10 p-3 rounded-full">
                          <resource.icon className="h-6 w-6 text-periwinkle" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{resource.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {resource.description}
                          </p>
                          {resource.internal ? (
                            <Link to={resource.link}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full border-linea bg-transparent hover:bg-superficie-2"
                              >
                                Abrir <ExternalLink className="h-3 w-3 ml-2" />
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full border-linea bg-transparent hover:bg-superficie-2"
                              onClick={() => window.open(resource.link, '_blank')}
                            >
                              Abrir <ExternalLink className="h-3 w-3 ml-2" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <Card className="rounded-[20px] border-linea bg-superficie">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-periwinkle" />
                  Siguiente Paso Recomendado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">
                  La implementación técnica está completa. El próximo paso crucial es configurar
                  Google Search Console para monitorear la indexación y solicitar inclusión en Google News.
                </p>
                <Link to="/admin/google-search-console-setup">
                  <Button
                    size="lg"
                    className="rounded-full border-0 bg-[linear-gradient(95deg,#004AAD,#597CFF)] text-white font-semibold shadow-[0_8px_32px_rgba(0,74,173,.4)] hover:opacity-95"
                  >
                    Ver Guía de Configuración
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

function ProgressBarNocturno({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`w-full rounded-full bg-superficie-2 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          value === 100 ? 'bg-verde' : 'bg-[linear-gradient(95deg,#004AAD,#597CFF)]'
        }`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default SEOGuide;
