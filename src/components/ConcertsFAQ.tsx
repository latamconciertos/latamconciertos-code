import { Link } from 'react-router-dom';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Sparkles } from 'lucide-react';

interface ConcertsFAQProps {
    countryName?: string;
    cityName?: string;
}

export const ConcertsFAQ = ({ countryName, cityName }: ConcertsFAQProps) => {
    const location = cityName || countryName || 'América Latina';

    const faqs = [
        {
            question: `¿Cómo comprar entradas para conciertos en ${location}?`,
            answer: (
                <>
                    En cada concierto listado encontrarás un enlace directo a la venta oficial de entradas.
                    Te conectamos con las tiqueteras autorizadas: <span className="font-medium text-foreground">Ticketmaster, TuBoleta, Passline, Joinnus</span> y más.
                    Siempre compra en sitios oficiales para evitar fraudes.
                </>
            ),
        },
        {
            question: `¿Cuándo es el próximo concierto en ${location}?`,
            answer: (
                <>
                    Consulta nuestro calendario actualizado arriba. Actualizamos diariamente con nuevas fechas anunciadas.
                    También puedes{' '}
                    <Link to="/artists" className="text-primary hover:underline font-medium">
                        seguir a tus artistas favoritos
                    </Link>
                    {' '}o usar nuestro{' '}
                    <Link to="/ai-asistente" className="text-primary hover:underline font-medium">
                        asistente IA
                    </Link>
                    {' '}para preguntas específicas.
                </>
            ),
        },
        {
            question: '¿Qué información incluye cada concierto?',
            answer: (
                <>
                    Para cada evento ofrecemos: <span className="font-medium text-foreground">fecha y hora exacta</span>,
                    ubicación del venue con mapa, información del artista, precios de entradas (cuando disponible),
                    enlaces para comprar tickets, y comunidad de fans. Después del show, agregamos{' '}
                    <Link to="/setlists" className="text-primary hover:underline font-medium">
                        setlists completos
                    </Link>.
                </>
            ),
        },
        {
            question: '¿Cómo sé si un concierto está confirmado?',
            answer: (
                <>
                    Todos los conciertos listados están oficialmente anunciados. Verificamos la información con fuentes oficiales:
                    cuentas de los artistas, promotoras y venues. Si hay cambios de fecha o cancelaciones, lo actualizamos inmediatamente.
                </>
            ),
        },
        {
            question: '¿Puedo guardar conciertos en mi calendario?',
            answer: (
                <>
                    ¡Sí! Crea una cuenta gratuita y usa{' '}
                    <Link to="/mi-calendario" className="text-primary hover:underline font-medium">
                        Mi Calendario
                    </Link>
                    {' '}para guardar tus conciertos favoritos y recibir recordatorios.
                </>
            ),
        },
    ];

    return (
        <section className="bg-gradient-to-b from-background via-muted/30 to-background py-16 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">Ayuda</span>
                    </div>
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <HelpCircle className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                            Preguntas Frecuentes sobre Conciertos
                        </h2>
                    </div>
                    {location !== 'América Latina' && (
                        <p className="text-muted-foreground">
                            Información sobre conciertos en {location}
                        </p>
                    )}
                </div>

                {/* Accordion FAQs */}
                <Accordion type="single" collapsible className="space-y-4">
                    {faqs.map((faq, index) => (
                        <AccordionItem
                            key={index}
                            value={`item-${index}`}
                            className="border border-border/50 rounded-xl px-6 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-primary/30 transition-all duration-300"
                        >
                            <AccordionTrigger className="text-left hover:no-underline py-5">
                                <span className="font-semibold text-base pr-4">
                                    {faq.question}
                                </span>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>

                {/* Bottom note */}
                <div className="text-center mt-8">
                    <p className="text-sm text-muted-foreground">
                        ¿Tienes más preguntas? Usa nuestro{' '}
                        <Link to="/ai-asistente" className="text-primary hover:underline font-medium">
                            Asistente IA
                        </Link>
                        {' '}para ayuda personalizada
                    </p>
                </div>
            </div>
        </section>
    );
};
