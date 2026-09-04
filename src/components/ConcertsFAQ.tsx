import { Link } from 'react-router-dom';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

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
                    <Link to="/artists" className="text-periwinkle hover:underline font-medium">
                        seguir a tus artistas favoritos
                    </Link>
                    {' '}o usar nuestro{' '}
                    <Link to="/ai-asistente" className="text-periwinkle hover:underline font-medium">
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
                    <Link to="/setlists" className="text-periwinkle hover:underline font-medium">
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
                    <Link to="/mi-calendario" className="text-periwinkle hover:underline font-medium">
                        Mi Calendario
                    </Link>
                    {' '}para guardar tus conciertos favoritos y recibir recordatorios.
                </>
            ),
        },
    ];

    return (
        <section className="py-16 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <span className="eyebrow-nocturno mb-3">Ayuda</span>
                    <h2 className="font-display text-3xl md:text-4xl font-extrabold uppercase tracking-[0.01em] leading-none text-foreground">
                        Preguntas frecuentes
                    </h2>
                    {location !== 'América Latina' && (
                        <p className="text-muted-foreground mt-3">
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
                            className="border border-linea rounded-[20px] px-6 bg-superficie hover:bg-superficie-2 hover:border-[rgba(231,4,133,.35)] transition-all duration-300"
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
                        <Link to="/ai-asistente" className="text-periwinkle hover:underline font-medium">
                            Asistente IA
                        </Link>
                        {' '}para ayuda personalizada
                    </p>
                </div>
            </div>
        </section>
    );
};
