import { Link } from 'react-router-dom';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, HelpCircle, Sparkles } from 'lucide-react';

/**
 * SEO Content Section for Home Page
 * Modern accordion design with premium aesthetics
 */
export const HomeSEOContent = () => {
    return (
        <section className="bg-gradient-to-b from-background via-muted/30 to-background py-16 px-4">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">Descubre Conciertos</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                        Tu Guía de Música en Vivo 2026
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Conciertos LATAM es la plataforma líder de música en vivo en América Latina.
                        Encuentra el calendario más completo de conciertos y festivales.
                    </p>
                </div>

                {/* Countries Grid - Visual Cards */}
                <div>
                    <div className="flex items-center gap-2 mb-6">
                        <MapPin className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-bold text-foreground">Explora por País</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                        {[
                            { name: 'Colombia', flag: '🇨🇴', slug: 'colombia' },
                            { name: 'México', flag: '🇲🇽', slug: 'mexico' },
                            { name: 'Argentina', flag: '🇦🇷', slug: 'argentina' },
                            { name: 'Chile', flag: '🇨🇱', slug: 'chile' },
                            { name: 'Perú', flag: '🇵🇪', slug: 'peru' },
                            { name: 'Ecuador', flag: '🇪🇨', slug: 'ecuador' },
                            { name: 'Uruguay', flag: '🇺🇾', slug: 'uruguay' },
                            { name: 'Bolivia', flag: '🇧🇴', slug: 'bolivia' },
                        ].map((country) => (
                            <Link
                                key={country.slug}
                                to={`/conciertos/${country.slug}`}
                                className="group"
                            >
                                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-primary/50">
                                    <CardContent className="p-4 text-center">
                                        <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                                            {country.flag}
                                        </div>
                                        <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                                            {country.name}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* FAQs Accordion */}
                <div>
                    <div className="flex items-center gap-2 mb-6">
                        <HelpCircle className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-bold text-foreground">Preguntas Frecuentes</h3>
                    </div>

                    <Accordion type="single" collapsible className="space-y-3">
                        <AccordionItem value="item-1" className="border border-border/50 rounded-lg px-6 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                            <AccordionTrigger className="text-left hover:no-underline">
                                <span className="font-semibold">¿Cómo comprar entradas para conciertos?</span>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                                En cada concierto listado en Conciertos LATAM encontrarás un enlace directo a la venta oficial de entradas.
                                Te conectamos con las tiqueteras autorizadas de cada país: <span className="font-medium text-foreground">Ticketmaster, TuBoleta, Passline, Joinnus</span> y más.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2" className="border border-border/50 rounded-lg px-6 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                            <AccordionTrigger className="text-left hover:no-underline">
                                <span className="font-semibold">¿Cuándo es el concierto de mi artista favorito?</span>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                                Usa nuestro buscador o consulta nuestra sección de{' '}
                                <Link to="/artists" className="text-primary hover:underline font-medium">
                                    artistas
                                </Link>
                                {' '}para encontrar todos los shows programados de tus artistas favoritos.
                                También puedes usar nuestro{' '}
                                <Link to="/ai-asistente" className="text-primary hover:underline font-medium">
                                    asistente IA
                                </Link>
                                {' '}para preguntas específicas.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-3" className="border border-border/50 rounded-lg px-6 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                            <AccordionTrigger className="text-left hover:no-underline">
                                <span className="font-semibold">¿Qué información encuentro sobre cada concierto?</span>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                                Para cada evento ofrecemos: <span className="font-medium text-foreground">fecha y hora exacta</span>, ubicación del venue con mapa,
                                información del artista, precios de entradas, comunidad de fans asistentes y enlaces directos para comprar tickets.
                                Después del show, agregamos{' '}
                                <Link to="/setlists" className="text-primary hover:underline font-medium">
                                    setlists completos
                                </Link>.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                {/* Bottom CTA */}
                <div className="text-center pt-4">
                    <p className="text-sm text-muted-foreground">
                        Nuestra plataforma te conecta directamente con las tiqueteras oficiales,
                        garantizando que compres tus entradas de forma segura.
                    </p>
                </div>
            </div>
        </section>
    );
};
