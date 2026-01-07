import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

interface FAQItem {
    question: string;
    answer: string;
    links?: { text: string; href: string }[];
}

interface ConcertsFAQProps {
    countryName?: string;
    cityName?: string;
}

export const ConcertsFAQ = ({ countryName, cityName }: ConcertsFAQProps) => {
    const location = cityName || countryName || 'América Latina';

    const faqs: FAQItem[] = [
        {
            question: `¿Cómo comprar entradas para conciertos en ${location}?`,
            answer: `En cada concierto listado encontrarás un enlace directo a la venta oficial de entradas. Te conectamos con las tiqueteras autorizadas: Ticketmaster, TuBoleta, Passline, Joinnus y más. Siempre compra en sitios oficiales para evitar fraudes.`,
        },
        {
            question: `¿Cuándo es el próximo concierto en ${location}?`,
            answer: `Consulta nuestro calendario actualizado arriba. Actualizamos diariamente con nuevas fechas anunciadas. También puedes`,
            links: [
                { text: 'seguir a tus artistas favoritos', href: '/artists' },
                { text: 'usar nuestro asistente IA', href: '/ai-asistente' },
            ],
        },
        {
            question: '¿Qué información incluye cada concierto?',
            answer: `Para cada evento ofrecemos: fecha y hora exacta, ubicación del venue con mapa, información del artista, precios de entradas (cuando disponible), enlaces para comprar tickets, y comunidad de fans. Después del show, agregamos`,
            links: [
                { text: 'setlists completos', href: '/setlists' },
            ],
        },
        {
            question: '¿Cómo sé si un concierto está confirmado?',
            answer: `Todos los conciertos listados están oficialmente anunciados. Verificamos la información con fuentes oficiales: cuentas de los artistas, promotoras y venues. Si hay cambios de fecha o cancelaciones, lo actualizamos inmediatamente.`,
        },
        {
            question: '¿Puedo guardar conciertos en mi calendario?',
            answer: `Sí! Crea una cuenta gratuita y usa`,
            links: [
                { text: 'Mi Calendario', href: '/mi-calendario' },
            ],
        },
    ];

    return (
        <section className="bg-muted/30 py-12 px-4 mt-12">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
                    Preguntas Frecuentes sobre Conciertos {location !== 'América Latina' && `en ${location}`}
                </h2>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-3">
                                    {faq.question}
                                </h3>
                                <div className="text-muted-foreground space-y-2">
                                    <p>
                                        {faq.answer}
                                        {faq.links && faq.links.length > 0 && (
                                            <>
                                                {' '}
                                                {faq.links.map((link, linkIndex) => (
                                                    <span key={linkIndex}>
                                                        <Link
                                                            to={link.href}
                                                            className="text-primary hover:underline font-medium"
                                                        >
                                                            {link.text}
                                                        </Link>
                                                        {linkIndex < faq.links!.length - 1 && ' o '}
                                                    </span>
                                                ))}
                                                .
                                            </>
                                        )}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};
