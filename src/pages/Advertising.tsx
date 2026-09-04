import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StadiumArcs } from '@/components/newhome/StadiumArcs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Newspaper, Handshake, Star, Send, ChevronDown, Mail, TrendingUp, Users, Search } from 'lucide-react';
import { advertisingSchema } from '@/lib/validation';
import { z } from 'zod';

const SITE_URL = 'https://www.conciertoslatam.com';
const PAGE_URL = `${SITE_URL}/publicidad`;
const CONTACT_EMAIL = 'latamconciertos@gmail.com';

// Los 4 productos comerciales (el ad_type que guarda el formulario)
const PRODUCTS = [
  {
    slug: 'evento-destacado',
    icon: Star,
    name: 'Evento destacado',
    description:
      'Tu concierto o festival en las posiciones premium: home, página de tu país y notificación push a nuestra comunidad. Los fans lo ven donde ya están buscando qué show ir a ver.',
  },
  {
    slug: 'pauta-display',
    icon: Megaphone,
    name: 'Pauta display',
    description:
      'Banners y espacios publicitarios en las páginas de mayor tráfico: listados de conciertos, artistas y noticias. Segmentación por país y por contexto musical.',
  },
  {
    slug: 'contenido-aliado',
    icon: Newspaper,
    name: 'Contenido aliado',
    description:
      'Notas editoriales, entrevistas y galerías sobre tu evento o marca, producidas por nuestro equipo y siempre identificadas como contenido patrocinado según nuestros lineamientos.',
  },
  {
    slug: 'media-partner',
    icon: Handshake,
    name: 'Media partner',
    description:
      'El paquete completo para promotoras: cubrimos tu evento del anuncio al setlist, con nota de anuncio, evento destacado, cobertura del show, galería y contenido post-evento.',
  },
] as const;

const FAQS = [
  {
    q: '¿Qué tipos de publicidad para conciertos y festivales ofrecen?',
    a: 'Cuatro formatos: evento destacado (posiciones premium + push), pauta display (banners segmentados por país), contenido aliado (notas editoriales patrocinadas) y media partner (cobertura completa de tu evento, del anuncio al setlist). Todos los paquetes se arman a la medida de tu objetivo.',
  },
  {
    q: '¿A qué audiencia llega la pauta en Conciertos Latam?',
    a: 'A fans de música en vivo de 16 países de América Latina que llegan buscando activamente conciertos, entradas, artistas y festivales. Es tráfico orgánico con intención real de compra, no audiencia fría. Cubrimos Colombia, México, Argentina, Chile, Perú y toda la región.',
  },
  {
    q: '¿Cuánto cuesta pautar en Conciertos Latam?',
    a: 'Armamos paquetes a la medida según el formato, el alcance y la duración de la campaña. Escríbenos con tu objetivo y te enviamos una propuesta con precios en un máximo de 48 horas.',
  },
  {
    q: '¿Trabajan con promotoras de conciertos como media partner?',
    a: 'Sí, es nuestro producto principal para promotoras. Acompañamos el evento completo: nota de anuncio, posición destacada mientras dura la venta, cobertura editorial del show, galería de fotos y setlist. Tu evento vive en el sitio antes, durante y después.',
  },
  {
    q: '¿El contenido patrocinado se identifica como tal?',
    a: 'Siempre. Todo contenido pagado se marca claramente como patrocinado y mantenemos separación entre lo editorial y lo publicitario, según nuestros lineamientos editoriales públicos. Eso protege tu marca y la confianza de la audiencia.',
  },
];

const Advertising = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    ad_type: '',
    budget_range: '',
    campaign_duration: '',
    target_audience: '',
    message: ''
  });

  // Números reales de la plataforma: prueba social que no hay que inventar
  const { data: stats } = useQuery({
    queryKey: ['advertising-stats'],
    queryFn: async () => {
      const [concerts, artists, news] = await Promise.all([
        supabase.from('concerts').select('id', { count: 'exact', head: true }),
        supabase.from('artists').select('id', { count: 'exact', head: true }),
        supabase.from('news_articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      ]);
      return {
        concerts: concerts.count ?? 0,
        artists: artists.count ?? 0,
        news: news.count ?? 0,
      };
    },
    staleTime: 60 * 60 * 1000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const validatedData = advertisingSchema.parse({
        company_name: formData.company_name.trim(),
        contact_name: formData.contact_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        website: formData.website.trim(),
        ad_type: formData.ad_type,
        budget_range: formData.budget_range,
        campaign_duration: formData.campaign_duration,
        target_audience: formData.target_audience.trim(),
        message: formData.message.trim(),
      });

      const { error } = await supabase.from('advertising_requests').insert([{
        company_name: validatedData.company_name,
        contact_name: validatedData.contact_name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        website: validatedData.website || null,
        ad_type: validatedData.ad_type,
        budget_range: validatedData.budget_range || null,
        campaign_duration: validatedData.campaign_duration || null,
        target_audience: validatedData.target_audience || null,
        message: validatedData.message || null,
      }]);
      if (error) throw error;

      // Fire-and-forget: notifica al equipo y auto-responde al lead.
      // Si falla, el lead ya quedó guardado en la tabla igual.
      supabase.functions.invoke('notify-lead', {
        body: {
          company_name: validatedData.company_name,
          contact_name: validatedData.contact_name,
          email: validatedData.email,
          phone: validatedData.phone || null,
          website: validatedData.website || null,
          ad_type: validatedData.ad_type,
          message: validatedData.message || null,
        },
      }).catch(() => { /* no bloquear la UX por el email */ });

      setSubmitted(true);
      toast({
        title: '¡Solicitud enviada!',
        description: 'Te respondemos en un máximo de 48 horas.'
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: 'Error de validación',
          description: firstError.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'No se pudo enviar la solicitud. Inténtalo de nuevo.',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const scrollToForm = () => {
    document.getElementById('solicitud')?.scrollIntoView({ behavior: 'smooth' });
  };

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Inicio", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Publicidad", "item": PAGE_URL },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${PAGE_URL}#service`,
      "name": "Publicidad y media partnerships para conciertos y festivales",
      "serviceType": "Publicidad digital para la industria de la música en vivo",
      "description": "Pauta display, eventos destacados, contenido patrocinado y media partnerships para promotoras, festivales, venues y marcas en América Latina.",
      "provider": { "@id": `${SITE_URL}/#organization` },
      "areaServed": { "@type": "Place", "name": "América Latina" },
      "audience": { "@type": "BusinessAudience", "name": "Promotoras de conciertos, festivales, venues, ticketeras y marcas" },
      "url": PAGE_URL,
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Formatos de publicidad",
        "itemListElement": PRODUCTS.map((p) => ({
          "@type": "Offer",
          "itemOffered": { "@type": "Service", "name": p.name, "description": p.description },
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": FAQS.map((f) => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a },
      })),
    },
  ];

  return (
    <>
      <SEO
        title="Publicidad para Conciertos y Festivales en América Latina | Pauta y Media Partner"
        description="Promociona tu concierto, festival o marca donde los fans ya lo buscan. Pauta display, eventos destacados, contenido patrocinado y media partnerships para promotoras en 16 países de LATAM. Cotiza en 48h."
        keywords="publicidad conciertos, promocionar concierto, pauta digital música, media partner conciertos, publicidad festivales, marketing musical latam, promocionar evento musical, publicidad promotoras, prensa conciertos colombia, difusión conciertos"
        url="/publicidad"
        structuredData={structuredData}
      />
      {/* "Evolución Nocturna": la página vive sobre la noche, como la home */}
      <div className="dark font-fira min-h-screen bg-noche text-texto">
        <Header />

        <main className="pt-24 md:pt-28 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[{ label: 'Publicidad' }]} />

            {/* Hero comercial */}
            <header className="relative mt-6 mb-12 md:mb-16 overflow-hidden">
              <StadiumArcs
                variant="mini"
                className="absolute -top-4 right-0 w-[400px] h-[200px] pointer-events-none hidden lg:block"
              />
              <div className="relative max-w-3xl">
                <span className="eyebrow-nocturno mb-3">Para promotoras, venues y marcas</span>
                <h1 className="font-display uppercase font-black tracking-[0.01em] leading-[0.95] text-foreground text-balance mb-5 text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                  Promociona tu concierto{' '}
                  <span className="bg-gradient-to-r from-periwinkle to-verde bg-clip-text text-transparent">
                    donde los fans ya lo buscan
                  </span>
                </h1>
                <p className="text-base md:text-lg text-texto-2 leading-relaxed max-w-2xl mb-8">
                  Conciertos Latam es la guía de música en vivo de América Latina: fans que llegan
                  buscando conciertos, entradas y artistas en 16 países. Publicidad con intención
                  real, no audiencia fría.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={scrollToForm} className="btn-nocturno">
                    Quiero pautar <Send className="h-4 w-4" />
                  </button>
                  <a href={`mailto:${CONTACT_EMAIL}`} className="btn-nocturno-secundario">
                    <Mail className="h-4 w-4" />
                    Escríbenos directo
                  </a>
                </div>
              </div>
            </header>

            {/* Números reales de la plataforma */}
            <section aria-label="Nuestra plataforma en números" className="mb-14 md:mb-20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
                {[
                  { value: stats ? `${stats.concerts}+` : '…', label: 'Conciertos cubiertos' },
                  { value: stats ? `${stats.artists}+` : '…', label: 'Artistas en el directorio' },
                  { value: '16', label: 'Países de LATAM' },
                  { value: stats ? `${stats.news}+` : '…', label: 'Historias publicadas' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-[20px] border border-linea bg-superficie p-5 text-center">
                    <p className="font-display text-3xl md:text-4xl font-black text-verde leading-none">{stat.value}</p>
                    <p className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.15em] text-texto-2 mt-2">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Productos */}
            <section className="mb-14 md:mb-20" aria-labelledby="productos">
              <span className="eyebrow-nocturno mb-3">Formatos</span>
              <h2 id="productos" className="font-display uppercase text-3xl md:text-4xl font-extrabold tracking-[0.01em] leading-none text-foreground mb-3">
                Publicidad que vive dentro del show
              </h2>
              <p className="text-texto-2 max-w-2xl mb-10">
                Cuatro formatos que se arman a la medida de tu objetivo: llenar un venue, vender
                entradas o poner tu marca frente a los fans.
              </p>
              <div className="grid md:grid-cols-2 gap-5">
                {PRODUCTS.map((product) => (
                  <div
                    key={product.slug}
                    className="rounded-[20px] border border-linea bg-superficie p-6 hover:border-[rgba(231,4,133,.35)] transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-periwinkle/10 flex items-center justify-center mb-4">
                      <product.icon className="h-6 w-6 text-periwinkle" />
                    </div>
                    <h3 className="text-xl font-bold text-texto mb-2">{product.name}</h3>
                    <p className="text-sm text-texto-2 leading-relaxed">{product.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Por qué funciona */}
            <section className="mb-14 md:mb-20" aria-labelledby="por-que">
              <span className="eyebrow-nocturno mb-3">Por qué funciona</span>
              <h2 id="por-que" className="font-display uppercase text-3xl md:text-4xl font-extrabold tracking-[0.01em] leading-none text-foreground mb-10">
                Audiencia con intención, no impresiones vacías
              </h2>
              <div className="grid md:grid-cols-3 gap-5">
                <div className="rounded-[20px] border border-linea bg-superficie p-6">
                  <Search className="h-6 w-6 text-periwinkle mb-4" />
                  <h3 className="font-bold text-texto mb-2">Llegan buscando</h3>
                  <p className="text-sm text-texto-2 leading-relaxed">
                    Nuestro tráfico viene de búsquedas como "conciertos en Bogotá" o el nombre del
                    artista. Son fans decidiendo a qué show ir: el momento exacto para aparecer.
                  </p>
                </div>
                <div className="rounded-[20px] border border-linea bg-superficie p-6">
                  <TrendingUp className="h-6 w-6 text-periwinkle mb-4" />
                  <h3 className="font-bold text-texto mb-2">Cobertura completa</h3>
                  <p className="text-sm text-texto-2 leading-relaxed">
                    Del anuncio al setlist: tu evento vive en el sitio antes, durante y después del
                    show, con noticias, galería y comunidad. No es un banner que desaparece.
                  </p>
                </div>
                <div className="rounded-[20px] border border-linea bg-superficie p-6">
                  <Users className="h-6 w-6 text-periwinkle mb-4" />
                  <h3 className="font-bold text-texto mb-2">Comunidad real</h3>
                  <p className="text-sm text-texto-2 leading-relaxed">
                    Fans que guardan conciertos, arman proyectos de fans y reciben notificaciones.
                    Tu evento no solo se ve: se agenda.
                  </p>
                </div>
              </div>
            </section>

            {/* Cómo funciona */}
            <section className="mb-14 md:mb-20" aria-labelledby="como-funciona">
              <span className="eyebrow-nocturno mb-3">El proceso</span>
              <h2 id="como-funciona" className="font-display uppercase text-3xl md:text-4xl font-extrabold tracking-[0.01em] leading-none text-foreground mb-10">
                Cómo pautar con nosotros
              </h2>
              <div className="grid md:grid-cols-3 gap-5">
                {[
                  { num: '01', title: 'Cuéntanos tu objetivo', text: 'Llena el formulario en un minuto: quién eres y qué quieres lograr, ya sea llenar un show, vender entradas o dar visibilidad a tu marca.' },
                  { num: '02', title: 'Recibe tu propuesta en 48h', text: 'Te enviamos un paquete a la medida con formatos, fechas y precios. Sin compromisos y sin llamadas eternas.' },
                  { num: '03', title: 'Tu evento sale al aire', text: 'Activamos la campaña y te compartimos resultados. Si eres promotora, la cobertura sigue hasta el setlist del show.' },
                ].map((step) => (
                  <div key={step.num} className="rounded-[20px] border border-linea bg-superficie p-6">
                    <p className="font-display text-4xl font-black text-verde leading-none mb-4">{step.num}</p>
                    <h3 className="font-bold text-texto mb-2">{step.title}</h3>
                    <p className="text-sm text-texto-2 leading-relaxed">{step.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ: alimenta el schema FAQPage */}
            <section className="mb-14 md:mb-20 max-w-3xl" aria-labelledby="faq-publicidad">
              <span className="eyebrow-nocturno mb-3">Preguntas frecuentes</span>
              <h2 id="faq-publicidad" className="font-display uppercase text-3xl md:text-4xl font-extrabold tracking-[0.01em] leading-none text-foreground mb-8">
                Publicidad en Conciertos Latam
              </h2>
              <div className="divide-y divide-linea border-y border-linea">
                {FAQS.map((faq, i) => (
                  <details key={i} className="group py-5">
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                      <h3 className="font-bold text-base md:text-lg text-foreground pr-4">{faq.q}</h3>
                      <ChevronDown className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform flex-shrink-0" />
                    </summary>
                    <p className="text-sm md:text-base text-texto-2 leading-relaxed mt-3 pr-9">
                      {faq.a}
                      {i === 4 && (
                        <>
                          {' '}
                          <Link to="/editorial-guidelines" className="text-periwinkle hover:underline">
                            Lee nuestros lineamientos editoriales
                          </Link>.
                        </>
                      )}
                    </p>
                  </details>
                ))}
              </div>
            </section>

            {/* Formulario de leads, corto a propósito */}
            <section id="solicitud" className="scroll-mt-28 max-w-2xl" aria-labelledby="form-title">
              <span className="eyebrow-nocturno mb-3">Hablemos</span>
              <h2 id="form-title" className="font-display uppercase text-3xl md:text-4xl font-extrabold tracking-[0.01em] leading-none text-foreground mb-3">
                Pauta con nosotros
              </h2>
              <p className="text-texto-2 mb-8">
                Un minuto y listo. Te respondemos con una propuesta en un máximo de 48 horas.
              </p>

              {submitted ? (
                <div className="rounded-[20px] border border-verde/30 bg-superficie p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-verde/10 flex items-center justify-center mx-auto mb-4">
                    <Send className="h-6 w-6 text-verde" />
                  </div>
                  <h3 className="font-display uppercase text-2xl font-extrabold tracking-[0.01em] text-texto mb-2">¡Solicitud recibida!</h3>
                  <p className="text-sm text-texto-2">
                    Te escribimos en un máximo de 48 horas con tu propuesta.
                    ¿Urgente? Escríbenos a{' '}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-periwinkle hover:underline">{CONTACT_EMAIL}</a>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="rounded-[20px] border border-linea bg-superficie p-6 md:p-8 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Empresa o promotora *</Label>
                      <Input
                        id="company_name"
                        required
                        value={formData.company_name}
                        onChange={e => handleChange('company_name', e.target.value)}
                        className="h-11 rounded-full bg-superficie-2 border-linea focus-visible:ring-periwinkle px-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_name">Tu nombre *</Label>
                      <Input
                        id="contact_name"
                        required
                        value={formData.contact_name}
                        onChange={e => handleChange('contact_name', e.target.value)}
                        className="h-11 rounded-full bg-superficie-2 border-linea focus-visible:ring-periwinkle px-4"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => handleChange('email', e.target.value)}
                        className="h-11 rounded-full bg-superficie-2 border-linea focus-visible:ring-periwinkle px-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ad_type">Qué te interesa *</Label>
                      <Select required value={formData.ad_type} onValueChange={value => handleChange('ad_type', value)}>
                        <SelectTrigger id="ad_type" className="h-11 rounded-full bg-superficie-2 border-linea focus:ring-periwinkle">
                          <SelectValue placeholder="Selecciona un formato" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCTS.map((p) => (
                            <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>
                          ))}
                          <SelectItem value="otro">Otro / no estoy seguro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Cuéntanos de tu evento o marca</Label>
                    <Textarea
                      id="message"
                      rows={4}
                      placeholder="Ej: Somos una promotora en Bogotá, tenemos un show en el Movistar Arena en noviembre y queremos llenar el venue…"
                      value={formData.message}
                      onChange={e => handleChange('message', e.target.value)}
                      className="rounded-2xl bg-superficie-2 border-linea focus-visible:ring-periwinkle"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-full border-0 bg-[linear-gradient(95deg,#7516E2,#E70485)] text-white font-semibold shadow-[0_8px_32px_rgba(117,22,226,.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(117,22,226,.6)]"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? 'Enviando...' : 'Enviar solicitud'}
                  </Button>
                  <p className="text-xs text-texto-2 text-center">
                    Sin spam y sin compromisos: solo tu propuesta en 48 horas.
                  </p>
                </form>
              )}
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Advertising;
