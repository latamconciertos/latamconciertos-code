import { Music, Users, Globe, Heart, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LatamMapAnimation from '@/components/LatamMapAnimation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const About = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Conciertos Latam",
    "url": "https://www.conciertoslatam.app",
    "logo": "https://storage.googleapis.com/gpt-engineer-file-uploads/Z29vckhx3OX2dJbEXJylHmg3SB23/social-images/social-1757981020072-Logo Principal transparente.png",
    "description": "Plataforma líder de información sobre conciertos y eventos musicales en América Latina",
    "foundingDate": "2024",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "latamconciertos@gmail.com",
      "contactType": "Customer Service"
    }
  };

  return (
    <>
      <SEO
        title="Acerca de Nosotros"
        description="Conciertos Latam es la plataforma líder de información sobre conciertos y eventos musicales en América Latina. Conoce nuestra misión y equipo."
        url="/about"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20 md:pt-24 pb-12">
          {/* Hero Section with Stats */}
          <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12 md:py-16">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left side - Decorative Map Concept */}
                <div className="relative hidden md:flex items-center justify-center">
                  <LatamMapAnimation />
                </div>

                {/* Right side - Stats and CTA */}
                <div className="space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full mb-3">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-primary font-medium text-sm">La Comunidad Musical de Latinoamérica</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-primary mb-3">
                      50,000+
                    </h1>
                    <p className="text-base text-muted-foreground leading-relaxed mb-4">
                      Fanáticos de la música de todos los países y gustos que tienen algo en común: están 
                      <span className="text-foreground font-medium"> descubriendo y conectando con la mejor música en vivo</span>.
                    </p>
                    <Button size="default" className="gap-2">
                      Únete Ahora
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* What We Do Section */}
          <section className="py-12 md:py-16 bg-background">
            <div className="container mx-auto px-4">
              <div className="text-center max-w-3xl mx-auto mb-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  <span className="text-foreground">Conciertos Latam en</span>{' '}
                  <span className="text-primary">la escena musical</span>
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  Conectamos a los fanáticos de la música con los mejores eventos en vivo, 
                  proporcionando información precisa, oportuna y completa sobre conciertos, 
                  festivales y shows en toda América Latina.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-10">
                <Card className="border hover:border-primary/50 transition-colors">
                  <CardContent className="pt-5 pb-5">
                    <Music className="h-8 w-8 text-primary mb-3" />
                    <h3 className="text-lg font-bold mb-2">Nuestra Misión</h3>
                    <p className="text-sm text-muted-foreground">
                      Ser el puente entre los artistas y sus fans, facilitando el descubrimiento de eventos 
                      musicales y ayudando a crear experiencias inolvidables.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border hover:border-primary/50 transition-colors">
                  <CardContent className="pt-5 pb-5">
                    <Heart className="h-8 w-8 text-primary mb-3" />
                    <h3 className="text-lg font-bold mb-2">Nuestra Visión</h3>
                    <p className="text-sm text-muted-foreground">
                      Ser la principal fuente de información musical en América Latina, fomentando la cultura 
                      de la música en vivo.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border hover:border-primary/50 transition-colors">
                  <CardContent className="pt-5 pb-5">
                    <Users className="h-8 w-8 text-primary mb-3" />
                    <h3 className="text-lg font-bold mb-2">Comunidad Activa</h3>
                    <p className="text-sm text-muted-foreground">
                      Una comunidad apasionada por la música que comparte experiencias, recomendaciones y 
                      descubre nuevos artistas cada día.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border hover:border-primary/50 transition-colors">
                  <CardContent className="pt-5 pb-5">
                    <Globe className="h-8 w-8 text-primary mb-3" />
                    <h3 className="text-lg font-bold mb-2">Cobertura Regional</h3>
                    <p className="text-sm text-muted-foreground">
                      México, Colombia, Argentina, Chile, Perú, Brasil, Uruguay, Ecuador, Costa Rica, 
                      Guatemala, Panamá y República Dominicana.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section className="py-12 md:py-16 bg-gradient-to-br from-secondary/5 via-background to-primary/5">
            <div className="container mx-auto px-4">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Nuestro Equipo</h2>
                <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
                  Apasionados por la música, impulsados por la tecnología
                </p>
              </div>

              {/* Team Members */}
              <div className="relative max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
                  {/* CEO */}
                  <div className="relative z-10">
                    <div className="relative group">
                      <div className="absolute -inset-6 bg-gradient-to-br from-primary to-primary/50 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                      
                      <div className="relative">
                        <div className="w-36 h-36 rounded-full bg-primary/20 border-2 border-primary/30 p-1.5">
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden">
                            <Users className="h-14 w-14 text-primary/40" />
                          </div>
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
                          <p className="font-semibold text-sm">Julian Felipe Diaz</p>
                          <p className="text-xs opacity-90 text-center">CEO & Founder</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative elements */}
                  <div className="hidden md:block absolute top-0 left-0 w-20 h-20 rounded-full bg-accent/20 animate-pulse delay-100"></div>
                  <div className="hidden md:block absolute top-12 right-0 w-16 h-16 rounded-full bg-secondary/20 animate-pulse delay-200"></div>
                  <div className="hidden md:block absolute bottom-0 left-1/4 w-18 h-18 rounded-full bg-primary/10 animate-pulse delay-300"></div>
                </div>

                {/* Team Description */}
                <div className="mt-16 text-center max-w-2xl mx-auto">
                  <Card className="border">
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Nuestro equipo está compuesto por periodistas musicales, fotógrafos, videógrafos y 
                        expertos en tecnología, todos unidos por la pasión de llevar la mejor información 
                        sobre música en vivo a nuestra comunidad latinoamericana.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* Values Section */}
          <section className="py-12 md:py-16 bg-background">
            <div className="container mx-auto px-4 max-w-3xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Nuestros Valores</h2>
              <div className="space-y-4">
                <Card className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-1.5 rounded-lg">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base mb-1">Precisión</h3>
                        <p className="text-sm text-muted-foreground">
                          Información verificada y actualizada constantemente para que nunca te pierdas un evento
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-secondary">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-secondary/10 p-1.5 rounded-lg">
                        <Globe className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base mb-1">Transparencia</h3>
                        <p className="text-sm text-muted-foreground">
                          Fuentes claras y procesos editoriales rigurosos en cada publicación
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-accent">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-accent/10 p-1.5 rounded-lg">
                        <Users className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base mb-1">Comunidad</h3>
                        <p className="text-sm text-muted-foreground">
                          Fomentamos el diálogo y la conexión entre fans de toda América Latina
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-1.5 rounded-lg">
                        <Heart className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base mb-1">Pasión</h3>
                        <p className="text-sm text-muted-foreground">
                          Amor genuino por la música y la cultura en vivo que se refleja en cada detalle
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-12 md:py-16 bg-gradient-to-br from-secondary/5 via-background to-primary/5">
            <div className="container mx-auto px-4 max-w-3xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full mb-3">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <span className="text-primary font-medium text-sm">Preguntas Frecuentes</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">¿Qué es Conciertos Latam?</h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  Todo lo que necesitas saber sobre nuestra plataforma
                </p>
              </div>

              <Accordion type="single" collapsible className="space-y-3">
                <AccordionItem value="item-1" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="text-left font-semibold">
                    ¿Qué encontrarás en Conciertos Latam?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2">
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong className="text-foreground">Calendario actualizado</strong> de conciertos y festivales en toda Latinoamérica</li>
                      <li><strong className="text-foreground">Información detallada</strong> de cada evento: fecha, venue, artistas y precios</li>
                      <li><strong className="text-foreground">Enlaces directos</strong> a la compra de entradas oficiales</li>
                      <li><strong className="text-foreground">Setlists</strong> de conciertos pasados para revivir la experiencia</li>
                      <li><strong className="text-foreground">Comunidad de fans</strong> para conectar con otros asistentes</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="text-left font-semibold">
                    ¿En qué venues puedo encontrar eventos?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p>
                      Listamos eventos en los mejores recintos de la región: Movistar Arena (Bogotá, Santiago, Buenos Aires), 
                      Estadio Nacional, Palacio de los Deportes, Foro Sol, Arena Ciudad de México, Luna Park, 
                      Teatro Caupolicán, y muchos más venues en toda América Latina.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="text-left font-semibold">
                    ¿Qué tipos de eventos cubren?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p>
                      Desde <strong className="text-foreground">conciertos individuales</strong> hasta <strong className="text-foreground">festivales masivos</strong> como 
                      Lollapalooza, Rock al Parque, Vive Latino, Estéreo Picnic, Primavera Sound, 
                      y giras internacionales de los artistas más importantes del mundo.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="text-left font-semibold">
                    ¿Qué países cubren?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p>
                      Cubrimos México, Colombia, Argentina, Chile, Perú, Brasil, Uruguay, Ecuador, Costa Rica, 
                      Guatemala, Panamá, República Dominicana y más países de América Latina. Constantemente 
                      estamos expandiendo nuestra cobertura para incluir más eventos en la región.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="text-left font-semibold">
                    ¿Cómo puedo comprar entradas?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p>
                      En cada concierto listado encontrarás un enlace directo a la venta oficial de entradas. 
                      Te conectamos con los proveedores autorizados como Ticketmaster, TuBoleta, Passline, 
                      Eticket y más, para que compres de forma segura.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>

          {/* Contact Section */}
          <section className="py-12 md:py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="container mx-auto px-4">
              <Card className="max-w-xl mx-auto border">
                <CardContent className="p-6 text-center">
                  <Music className="h-10 w-10 text-primary mx-auto mb-3" />
                  <h2 className="text-xl font-bold mb-3">¿Quieres colaborar con nosotros?</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Si tienes preguntas, sugerencias o quieres formar parte de Conciertos Latam, 
                    nos encantaría saber de ti.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                    <a 
                      href="mailto:latamconciertos@gmail.com" 
                      className="text-primary hover:underline font-medium text-sm"
                    >
                      latamconciertos@gmail.com
                    </a>
                    <Button size="sm">
                      Contáctanos
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default About;
