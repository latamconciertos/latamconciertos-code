import { Music, Users, Globe, Heart, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const About = () => {
  const SITE_URL = 'https://www.conciertoslatam.app';
  const ORG_ID = `${SITE_URL}/#organization`;
  const JULIAN_ID = `${SITE_URL}/about#julian-felipe-diaz`;
  const JUAN_ID = `${SITE_URL}/about#juan-pablo-contreras`;

  const team = [
    {
      id: JULIAN_ID,
      anchor: 'julian-felipe-diaz',
      name: 'Julian Felipe Diaz',
      role: 'Founder & CEO',
      bio: 'Fundó Conciertos Latam en 2024 para resolver un vacío real: la falta de un solo lugar confiable, en español, para descubrir conciertos en LATAM y comprar entradas oficiales sin reventa. Lidera la estrategia, el producto y el equipo distribuido en la región.',
      links: {
        linkedin: 'https://www.linkedin.com/in/julianfelipediazcontreras/',
      },
    },
    {
      id: JUAN_ID,
      anchor: 'juan-pablo-contreras',
      name: 'Juan Pablo Contreras',
      role: 'Co-founder',
      bio: 'Cofundador de Conciertos Latam. Aporta visión de producto y experiencia de usuario para construir la plataforma editorial de música en vivo más relevante de América Latina.',
      links: {
        // TODO: replace with real URLs
        linkedin: '',
      },
    },
  ] as const;

  const julianSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": JULIAN_ID,
    "name": "Julian Felipe Diaz",
    "givenName": "Julian Felipe",
    "familyName": "Diaz",
    "jobTitle": "Founder & CEO",
    "description": team[0].bio,
    "url": `${SITE_URL}/about#${team[0].anchor}`,
    "worksFor": { "@id": ORG_ID },
    "founderOf": { "@id": ORG_ID },
    "knowsAbout": [
      "Música en vivo",
      "Industria musical en América Latina",
      "Conciertos",
      "Festivales musicales",
      "Tecnología y producto",
    ],
    "nationality": { "@type": "Country", "name": "Colombia" },
    "sameAs": [
      "https://www.linkedin.com/in/julianfelipediazcontreras/",
    ],
  };

  const juanSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": JUAN_ID,
    "name": "Juan Pablo Contreras",
    "givenName": "Juan Pablo",
    "familyName": "Contreras",
    "jobTitle": "Co-founder",
    "description": team[1].bio,
    "url": `${SITE_URL}/about#${team[1].anchor}`,
    "worksFor": { "@id": ORG_ID },
    "founderOf": { "@id": ORG_ID },
    "sameAs": [],
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    "name": "Conciertos Latam",
    "alternateName": ["ConciertosLatam", "Conciertos LATAM"],
    "url": SITE_URL,
    "logo": "https://storage.googleapis.com/gpt-engineer-file-uploads/Z29vckhx3OX2dJbEXJylHmg3SB23/social-images/social-1757981020072-Logo Principal transparente.png",
    "description": "Plataforma líder de información sobre conciertos y eventos musicales en América Latina. Encuentra fechas, venues, artistas y compra entradas en México, Colombia, Argentina, Chile, Perú y Brasil.",
    "foundingDate": "2024",
    "founder": [{ "@id": JULIAN_ID }, { "@id": JUAN_ID }],
    "employee": [{ "@id": JULIAN_ID }, { "@id": JUAN_ID }],
    "areaServed": [
      { "@type": "Country", "name": "México" },
      { "@type": "Country", "name": "Colombia" },
      { "@type": "Country", "name": "Argentina" },
      { "@type": "Country", "name": "Chile" },
      { "@type": "Country", "name": "Perú" },
      { "@type": "Country", "name": "Brasil" },
    ],
    "sameAs": [],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "latamconciertos@gmail.com",
      "contactType": "Customer Service",
    },
  };

  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "url": `${SITE_URL}/about`,
    "name": "Acerca de Conciertos Latam",
    "description": "Conoce al equipo fundador y la historia detrás de Conciertos Latam, la plataforma líder de música en vivo en América Latina.",
    "mainEntity": { "@id": ORG_ID },
    "about": [{ "@id": ORG_ID }, { "@id": JULIAN_ID }, { "@id": JUAN_ID }],
  };

  const structuredData = [aboutPageSchema, organizationSchema, julianSchema, juanSchema];

  return (
    <>
      <SEO
        title="Acerca de Conciertos Latam · Equipo, misión y fundadores"
        description="Conciertos Latam fue fundada en 2024 por Julian Felipe Diaz (Founder & CEO) y Juan Pablo Contreras (Co-founder). La plataforma líder de música en vivo en América Latina con +50,000 fanáticos en 16 países."
        keywords="Conciertos Latam equipo, fundadores Conciertos Latam, Julian Felipe Diaz CEO, Juan Pablo Contreras cofundador, quién fundó Conciertos Latam, plataforma música latam"
        url="/about"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-24 md:pt-28 pb-12">
          {/* Editorial Hero */}
          <section aria-labelledby="about-hero-heading" className="container mx-auto px-4 mt-6 mb-16 md:mb-24">
            <div className="text-center max-w-4xl mx-auto">
              <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.22em] text-primary mb-3">
                La comunidad musical de Latinoamérica
              </p>
              <h1
                id="about-hero-heading"
                className="font-display uppercase text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[-0.015em] leading-[0.92] text-foreground text-balance mb-5 md:mb-6"
              >
                Acerca de Conciertos Latam
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8 md:mb-10">
                Somos la plataforma editorial líder de música en vivo en América Latina. Más de 50,000 fans nos eligen para descubrir, comprar entradas y vivir conciertos en 16 países de la región.
              </p>

              {/* Stats inline editorial */}
              <div className="flex flex-wrap justify-center gap-x-10 md:gap-x-14 gap-y-4 mb-8 md:mb-10">
                <div className="flex flex-col items-center min-w-[90px]">
                  <span className="font-display text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none">
                    50K+
                  </span>
                  <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-1.5">
                    Fans activos
                  </span>
                </div>
                <div className="flex flex-col items-center min-w-[90px]">
                  <span className="font-display text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none">
                    16
                  </span>
                  <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-1.5">
                    Países
                  </span>
                </div>
                <div className="flex flex-col items-center min-w-[90px]">
                  <span className="font-display text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none">
                    2024
                  </span>
                  <span className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-1.5">
                    Fundación
                  </span>
                </div>
              </div>

              <Button size="lg" className="rounded-full px-8 font-bold uppercase tracking-[0.15em] text-xs">
                Únete a la comunidad
              </Button>
            </div>
          </section>

          {/* Mission / Vision / Community / Coverage */}
          <section className="py-12 md:py-16 bg-background border-t border-border/40">
            <div className="container mx-auto px-4">
              <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
                <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.22em] text-primary mb-2">
                  Lo que hacemos
                </p>
                <h2 className="font-display uppercase text-3xl md:text-4xl font-black tracking-tight leading-[0.95] text-foreground mb-3">
                  Música en vivo, sin filtros
                </h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Conectamos a los fans con los mejores eventos en vivo, con información precisa, oportuna y completa de conciertos, festivales y shows en toda América Latina.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 md:gap-5 max-w-4xl mx-auto">
                {[
                  { icon: Music, title: 'Misión', desc: 'Ser el puente entre los artistas y sus fans, facilitando el descubrimiento de eventos musicales y ayudando a crear experiencias inolvidables.' },
                  { icon: Heart, title: 'Visión', desc: 'Ser la principal fuente de información musical en América Latina, fomentando la cultura de la música en vivo.' },
                  { icon: Users, title: 'Comunidad', desc: 'Una comunidad apasionada por la música que comparte experiencias, recomendaciones y descubre nuevos artistas cada día.' },
                  { icon: Globe, title: 'Cobertura', desc: 'México, Colombia, Argentina, Chile, Perú, Brasil, Uruguay, Ecuador, Costa Rica, Guatemala, Panamá, República Dominicana y más.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <Card key={title} className="border-border/60 bg-card hover:border-primary/30 transition-colors">
                    <CardContent className="p-5 md:p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                          {title}
                        </p>
                      </div>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        {desc}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Team Section — balanced, editorial, schema-anchored */}
          <section className="py-12 md:py-16 bg-gradient-to-br from-secondary/5 via-background to-primary/5 border-y border-border/40">
            <div className="container mx-auto px-4">
              <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
                <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.22em] text-primary mb-2">
                  Quiénes somos
                </p>
                <h2 className="font-display uppercase text-3xl md:text-4xl font-black tracking-tight leading-[0.95] text-foreground mb-3">
                  El equipo fundador
                </h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Conciertos Latam fue fundada en 2024 por un equipo apasionado por la música en vivo y la cultura latinoamericana.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-5 md:gap-6 max-w-4xl mx-auto">
                {team.map((person) => (
                  <article
                    key={person.anchor}
                    id={person.anchor}
                    itemScope
                    itemType="https://schema.org/Person"
                    className="bg-card border border-border/60 rounded-2xl p-5 md:p-6 hover:border-primary/30 transition-colors"
                  >
                    <link itemProp="url" href={`${SITE_URL}/about#${person.anchor}`} />
                    <div className="flex items-start gap-4">
                      <div
                        className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-border/60 flex items-center justify-center"
                        itemProp="image"
                      >
                        {/* TODO: Replace with real photo */}
                        <Users className="h-7 w-7 md:h-9 md:w-9 text-primary/40" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-1">
                          <span itemProp="jobTitle">{person.role}</span>
                        </p>
                        <h3 className="font-bold text-base md:text-lg text-foreground leading-tight" itemProp="name">
                          {person.name}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-4" itemProp="description">
                      {person.bio}
                    </p>
                    {person.links.linkedin && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <a
                          href={person.links.linkedin}
                          target="_blank"
                          rel="noopener noreferrer me"
                          itemProp="sameAs"
                          className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                        >
                          LinkedIn →
                        </a>
                      </div>
                    )}
                  </article>
                ))}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed text-center max-w-2xl mx-auto mt-10">
                Junto al equipo fundador, Conciertos Latam reúne periodistas musicales, fotógrafos, videógrafos y desarrolladores de toda la región — todos unidos por la pasión de llevar la mejor información sobre música en vivo a la comunidad latinoamericana.
              </p>
            </div>
          </section>

          {/* Values Section */}
          <section className="py-12 md:py-16 bg-background border-t border-border/40">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="text-center mb-10 md:mb-12">
                <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.22em] text-primary mb-2">
                  Lo que nos impulsa
                </p>
                <h2 className="font-display uppercase text-3xl md:text-4xl font-black tracking-tight leading-[0.95] text-foreground">
                  Nuestros valores
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
                {[
                  { icon: Sparkles, title: 'Precisión', desc: 'Información verificada y actualizada constantemente para que nunca te pierdas un evento.' },
                  { icon: Globe, title: 'Transparencia', desc: 'Fuentes claras y procesos editoriales rigurosos en cada publicación.' },
                  { icon: Users, title: 'Comunidad', desc: 'Fomentamos el diálogo y la conexión entre fans de toda América Latina.' },
                  { icon: Heart, title: 'Pasión', desc: 'Amor genuino por la música y la cultura en vivo que se refleja en cada detalle.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <Card key={title} className="border-border/60 bg-card hover:border-primary/30 transition-colors group">
                    <CardContent className="p-5 md:p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                          {title}
                        </p>
                      </div>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        {desc}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-12 md:py-16 bg-gradient-to-br from-secondary/5 via-background to-primary/5 border-t border-border/40">
            <div className="container mx-auto px-4 max-w-3xl">
              <div className="text-center mb-10 md:mb-12">
                <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.22em] text-primary mb-2">
                  Preguntas frecuentes
                </p>
                <h2 className="font-display uppercase text-3xl md:text-4xl font-black tracking-tight leading-[0.95] text-foreground mb-3">
                  ¿Qué es Conciertos Latam?
                </h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Todo lo que necesitas saber sobre nuestra plataforma
                </p>
              </div>

              <Accordion type="single" collapsible className="space-y-3">
                <AccordionItem value="item-1" className="border border-border/60 rounded-xl px-5 bg-card">
                  <AccordionTrigger className="text-left text-sm md:text-base font-bold">
                    ¿Qué encontrarás en Conciertos Latam?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground space-y-2 text-sm md:text-base">
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong className="text-foreground">Calendario actualizado</strong> de conciertos y festivales en toda Latinoamérica</li>
                      <li><strong className="text-foreground">Información detallada</strong> de cada evento: fecha, venue, artistas y precios</li>
                      <li><strong className="text-foreground">Enlaces directos</strong> a la compra de entradas oficiales</li>
                      <li><strong className="text-foreground">Setlists</strong> de conciertos pasados para revivir la experiencia</li>
                      <li><strong className="text-foreground">Comunidad de fans</strong> para conectar con otros asistentes</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border border-border/60 rounded-xl px-5 bg-card">
                  <AccordionTrigger className="text-left text-sm md:text-base font-bold">
                    ¿En qué venues puedo encontrar eventos?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm md:text-base leading-relaxed">
                    Listamos eventos en los mejores recintos de la región: Movistar Arena (Bogotá, Santiago, Buenos Aires), Estadio Nacional, Palacio de los Deportes, Foro Sol, Arena Ciudad de México, Luna Park, Teatro Caupolicán, y muchos más venues en toda América Latina.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border border-border/60 rounded-xl px-5 bg-card">
                  <AccordionTrigger className="text-left text-sm md:text-base font-bold">
                    ¿Qué tipos de eventos cubren?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm md:text-base leading-relaxed">
                    Desde <strong className="text-foreground">conciertos individuales</strong> hasta <strong className="text-foreground">festivales masivos</strong> como Lollapalooza, Rock al Parque, Vive Latino, Estéreo Picnic, Primavera Sound, y giras internacionales de los artistas más importantes del mundo.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border border-border/60 rounded-xl px-5 bg-card">
                  <AccordionTrigger className="text-left text-sm md:text-base font-bold">
                    ¿Qué países cubren?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm md:text-base leading-relaxed">
                    Cubrimos México, Colombia, Argentina, Chile, Perú, Brasil, Uruguay, Ecuador, Costa Rica, Guatemala, Panamá, República Dominicana y más países de América Latina. Constantemente estamos expandiendo nuestra cobertura para incluir más eventos en la región.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border border-border/60 rounded-xl px-5 bg-card">
                  <AccordionTrigger className="text-left text-sm md:text-base font-bold">
                    ¿Cómo puedo comprar entradas?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm md:text-base leading-relaxed">
                    En cada concierto listado encontrarás un enlace directo a la venta oficial de entradas. Te conectamos con los proveedores autorizados como Ticketmaster, TuBoleta, Passline, Eticket y más, para que compres de forma segura.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>

          {/* Contact Section */}
          <section className="py-16 md:py-24 bg-background border-t border-border/40">
            <div className="container mx-auto px-4 max-w-2xl text-center">
              <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.22em] text-primary mb-3">
                Hablemos
              </p>
              <h2 className="font-display uppercase text-3xl md:text-4xl font-black tracking-tight leading-[0.95] text-foreground mb-4">
                ¿Querés colaborar?
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto">
                Si tenés preguntas, sugerencias, una historia para contar, o querés sumarte al equipo de Conciertos Latam, nos encantaría saber de vos.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                <a
                  href="mailto:latamconciertos@gmail.com"
                  className="text-primary hover:underline font-semibold text-sm"
                >
                  latamconciertos@gmail.com
                </a>
                <span className="hidden sm:inline text-muted-foreground/40">·</span>
                <Button size="lg" className="rounded-full px-8 font-bold uppercase tracking-[0.15em] text-xs">
                  Contáctanos
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default About;
