import { CheckCircle2, ExternalLink, Copy, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useState } from 'react';
import { toast } from 'sonner';

const GoogleSearchConsoleSetup = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const siteUrl = 'https://conciertoslatam.lovable.app';
  
  const sitemaps = [
    { name: 'Sitemap Principal (Index)', url: `${siteUrl}/sitemap.xml` },
    { name: 'Páginas Estáticas', url: `${siteUrl}/sitemap-pages.xml` },
    { name: 'Noticias (Google News)', url: 'https://ybvfsxsapsshhtqpvukr.supabase.co/functions/v1/generate-news-sitemap' },
    { name: 'Artistas', url: 'https://ybvfsxsapsshhtqpvukr.supabase.co/functions/v1/generate-artists-sitemap' },
    { name: 'Conciertos', url: 'https://ybvfsxsapsshhtqpvukr.supabase.co/functions/v1/generate-concerts-sitemap' },
    { name: 'Promotoras', url: 'https://ybvfsxsapsshhtqpvukr.supabase.co/functions/v1/generate-promoters-sitemap' },
  ];

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('URL copiada al portapapeles');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <>
      <SEO
        title="Configuración de Google Search Console"
        description="Guía completa para configurar Google Search Console y enviar sitemaps de Conciertos Latam"
        keywords="google search console, seo, sitemaps, indexación, google news"
        url="/admin/google-search-console-setup"
      />
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-16">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Google Search Console' }
          ]} />

          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <Badge className="mb-4 text-lg px-4 py-2">
                Configuración SEO
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Google Search Console
              </h1>
              <p className="text-xl text-muted-foreground">
                Guía paso a paso para optimizar la indexación del sitio
              </p>
            </div>

            {/* Alert de importancia */}
            <Alert className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>¿Por qué es importante?</AlertTitle>
              <AlertDescription>
                Google Search Console te permite monitorear cómo Google ve tu sitio, detectar problemas de indexación,
                y mejorar tu posicionamiento en los resultados de búsqueda. Es esencial para aparecer en Google News.
              </AlertDescription>
            </Alert>

            {/* Paso 1: Verificar propiedad */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    1
                  </div>
                  <CardTitle>Verificar Propiedad del Sitio</CardTitle>
                </div>
                <CardDescription>
                  Demuestra a Google que eres el dueño del dominio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Ve a <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                    Google Search Console <ExternalLink className="h-3 w-3" />
                  </a></li>
                  <li>Haz clic en "Agregar propiedad"</li>
                  <li>Selecciona "Prefijo de URL" e ingresa: <code className="bg-muted px-2 py-1 rounded">{siteUrl}</code></li>
                  <li>Elige el método de verificación recomendado (archivo HTML, meta tag, o Google Analytics)</li>
                  <li>Sigue las instrucciones específicas del método elegido</li>
                  <li>Haz clic en "Verificar"</li>
                </ol>
                <Button variant="outline" onClick={() => window.open('https://search.google.com/search-console', '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Google Search Console
                </Button>
              </CardContent>
            </Card>

            {/* Paso 2: Enviar sitemaps */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    2
                  </div>
                  <CardTitle>Enviar Sitemaps</CardTitle>
                </div>
                <CardDescription>
                  Ayuda a Google a descubrir todo tu contenido
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground mb-4">
                  Una vez verificado el sitio, envía estos sitemaps en Google Search Console:
                </p>
                
                <div className="space-y-3">
                  {sitemaps.map((sitemap, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{sitemap.name}</p>
                        <code className="text-xs text-muted-foreground break-all">{sitemap.url}</code>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(sitemap.url, index)}
                      >
                        {copiedIndex === index ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm font-semibold mb-2">📋 Cómo enviar:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>En Google Search Console, ve a "Sitemaps" en el menú lateral</li>
                    <li>Copia la URL del sitemap (haz clic en el icono copiar arriba)</li>
                    <li>Pégala en el campo "Agregar un sitemap nuevo"</li>
                    <li>Haz clic en "Enviar"</li>
                    <li>Repite para cada sitemap de la lista</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Paso 3: Configurar Google News */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    3
                  </div>
                  <CardTitle>Solicitar Inclusión en Google News</CardTitle>
                </div>
                <CardDescription>
                  Aparece en Google News y aumenta tu visibilidad
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Para aparecer en Google News, tu sitio debe cumplir con los <a 
                    href="https://support.google.com/news/publisher-center/answer/9606710" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    requisitos de contenido <ExternalLink className="h-3 w-3" />
                  </a>:
                </p>
                
                <div className="grid gap-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Contenido original y de calidad</p>
                      <p className="text-sm text-muted-foreground">Artículos únicos con información valiosa</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Publicación regular</p>
                      <p className="text-sm text-muted-foreground">Al menos 2-3 artículos por semana</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Información clara del autor y fecha</p>
                      <p className="text-sm text-muted-foreground">Bylines y timestamps visibles</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Sitemap de noticias optimizado ✅</p>
                      <p className="text-sm text-muted-foreground">Ya implementado en este sitio</p>
                    </div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => window.open('https://publishercenter.google.com/', '_blank')}
                  className="mt-4"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ir a Google Publisher Center
                </Button>
              </CardContent>
            </Card>

            {/* Paso 4: Monitoreo */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">
                    4
                  </div>
                  <CardTitle>Monitorear y Optimizar</CardTitle>
                </div>
                <CardDescription>
                  Revisa regularmente el rendimiento del sitio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground mb-4">
                  Después de configurar Google Search Console, revisa estos reportes regularmente:
                </p>
                
                <div className="space-y-2">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-semibold text-sm">📊 Rendimiento</p>
                    <p className="text-xs text-muted-foreground">Clics, impresiones, CTR y posición promedio</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-semibold text-sm">🔍 Cobertura</p>
                    <p className="text-xs text-muted-foreground">Páginas indexadas y errores de rastreo</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-semibold text-sm">📱 Experiencia en móviles</p>
                    <p className="text-xs text-muted-foreground">Usabilidad y Core Web Vitals</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-semibold text-sm">🗺️ Sitemaps</p>
                    <p className="text-xs text-muted-foreground">Estado de los sitemaps enviados</p>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Consejo Pro</AlertTitle>
                  <AlertDescription>
                    Configura alertas por email para recibir notificaciones sobre problemas críticos de indexación.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default GoogleSearchConsoleSetup;
