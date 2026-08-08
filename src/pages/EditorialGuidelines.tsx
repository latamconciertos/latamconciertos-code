import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { CheckCircle2, FileCheck, Users, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const EditorialGuidelines = () => {
  return (
    <>
      <SEO
        title="Lineamientos Editoriales"
        description="Conoce los estándares de calidad y procesos editoriales de Conciertos Latam. Compromiso con la precisión y transparencia informativa."
        url="/editorial-guidelines"
      />
      {/* "Evolución Nocturna": la página vive sobre la noche, como la home */}
      <div className="dark font-fira min-h-screen bg-noche text-texto">
        <Header />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-28 pb-12">
          <span className="eyebrow-nocturno mb-3">Editorial</span>
          <h1 className="font-display uppercase text-4xl md:text-6xl font-black tracking-[0.01em] leading-[0.95] text-foreground mb-5">
            Lineamientos Editoriales
          </h1>

          <p className="text-lg md:text-xl text-texto-2 leading-relaxed max-w-2xl mb-10">
            Así trabajamos las historias que lees: con la excelencia periodística y la transparencia que la música en vivo se merece.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="rounded-[20px] border-linea bg-superficie hover:border-[rgba(89,124,255,.35)] transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-periwinkle/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-periwinkle" />
                </div>
                <h2 className="text-xl font-bold mb-2">Precisión</h2>
                <p className="text-muted-foreground text-sm">
                  Verificamos toda información antes de publicarla. Corregimos errores de manera transparente y oportuna.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[20px] border-linea bg-superficie hover:border-[rgba(89,124,255,.35)] transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-periwinkle/10 flex items-center justify-center mb-4">
                  <FileCheck className="h-6 w-6 text-periwinkle" />
                </div>
                <h2 className="text-xl font-bold mb-2">Fuentes Confiables</h2>
                <p className="text-muted-foreground text-sm">
                  Citamos fuentes oficiales, comunicados de prensa y verificamos información con múltiples fuentes cuando es posible.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[20px] border-linea bg-superficie hover:border-[rgba(89,124,255,.35)] transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-periwinkle/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-periwinkle" />
                </div>
                <h2 className="text-xl font-bold mb-2">Independencia</h2>
                <p className="text-muted-foreground text-sm">
                  Mantenemos independencia editorial. Nuestro contenido no está influenciado por anunciantes o patrocinadores.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[20px] border-linea bg-superficie hover:border-[rgba(89,124,255,.35)] transition-colors">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-periwinkle/10 flex items-center justify-center mb-4">
                  <AlertCircle className="h-6 w-6 text-periwinkle" />
                </div>
                <h2 className="text-xl font-bold mb-2">Transparencia</h2>
                <p className="text-muted-foreground text-sm">
                  Identificamos claramente contenido patrocinado y opinión. Corregimos errores visiblemente.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-none text-texto-2 leading-relaxed divide-y divide-linea [&>section]:py-8 [&>section:first-child]:pt-0 [&_strong]:text-texto [&_strong]:font-semibold">
            <section>
              <h2 className="flex items-baseline gap-3 mb-4">
                <span className="font-display text-3xl font-black text-verde leading-none">01</span>
                <span className="font-display uppercase text-2xl font-extrabold tracking-[0.01em] text-foreground leading-none">Estándares de calidad</span>
              </h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-2">Verificación de Información</h3>
              <ul className="list-disc pl-6 space-y-2 marker:text-periwinkle">
                <li>Confirmamos fechas, lugares y detalles de eventos con fuentes oficiales</li>
                <li>Contactamos a organizadores y promotores para verificación</li>
                <li>Utilizamos múltiples fuentes cuando sea posible</li>
                <li>Etiquetamos información no confirmada claramente como "rumor" o "pendiente de confirmación"</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">Contenido Original</h3>
              <ul className="list-disc pl-6 space-y-2 marker:text-periwinkle">
                <li>Priorizamos contenido original y análisis propio</li>
                <li>Citamos apropiadamente cuando usamos información de otras fuentes</li>
                <li>Agregamos valor con contexto, análisis y perspectiva local</li>
              </ul>
            </section>

            <section>
              <h2 className="flex items-baseline gap-3 mb-4">
                <span className="font-display text-3xl font-black text-verde leading-none">02</span>
                <span className="font-display uppercase text-2xl font-extrabold tracking-[0.01em] text-foreground leading-none">Proceso editorial</span>
              </h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-2">Redacción</h3>
              <ul className="list-disc pl-6 space-y-2 marker:text-periwinkle">
                <li>Títulos claros y precisos que reflejan el contenido</li>
                <li>Primer párrafo con información esencial (quién, qué, cuándo, dónde)</li>
                <li>Lenguaje claro y accesible para audiencia general</li>
                <li>Mínimo de 500 palabras para artículos de fondo</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">Revisión</h3>
              <ul className="list-disc pl-6 space-y-2 marker:text-periwinkle">
                <li>Revisión editorial antes de publicación</li>
                <li>Verificación de enlaces y fuentes</li>
                <li>Corrección ortográfica y gramatical</li>
                <li>Verificación de imágenes y derechos de uso</li>
              </ul>
            </section>

            <section>
              <h2 className="flex items-baseline gap-3 mb-4">
                <span className="font-display text-3xl font-black text-verde leading-none">03</span>
                <span className="font-display uppercase text-2xl font-extrabold tracking-[0.01em] text-foreground leading-none">Fuentes y atribución</span>
              </h2>
              <ul className="list-disc pl-6 space-y-2 marker:text-periwinkle">
                <li><strong>Fuentes primarias:</strong> Comunicados oficiales, entrevistas directas, sitios web oficiales</li>
                <li><strong>Fuentes secundarias:</strong> Medios reconocidos, agencias de noticias, redes sociales verificadas</li>
                <li><strong>Atribución:</strong> Siempre citamos la fuente de información</li>
                <li><strong>Enlaces:</strong> Incluimos enlaces a fuentes cuando es posible</li>
              </ul>
            </section>

            <section>
              <h2 className="flex items-baseline gap-3 mb-4">
                <span className="font-display text-3xl font-black text-verde leading-none">04</span>
                <span className="font-display uppercase text-2xl font-extrabold tracking-[0.01em] text-foreground leading-none">Correcciones y actualizaciones</span>
              </h2>
              <ul className="list-disc pl-6 space-y-2 marker:text-periwinkle">
                <li><strong>Correcciones menores:</strong> Se realizan de inmediato (errores tipográficos, fechas)</li>
                <li><strong>Correcciones significativas:</strong> Se nota al inicio del artículo con fecha de corrección</li>
                <li><strong>Actualizaciones:</strong> Artículos se actualizan cuando hay nueva información relevante</li>
                <li><strong>Transparencia:</strong> Mantenemos historial de cambios significativos</li>
              </ul>
            </section>

            <section>
              <h2 className="flex items-baseline gap-3 mb-4">
                <span className="font-display text-3xl font-black text-verde leading-none">05</span>
                <span className="font-display uppercase text-2xl font-extrabold tracking-[0.01em] text-foreground leading-none">Imágenes y multimedia</span>
              </h2>
              <ul className="list-disc pl-6 space-y-2 marker:text-periwinkle">
                <li>Usamos solo imágenes con permisos apropiados</li>
                <li>Atribuimos créditos de fotógrafos y fuentes</li>
                <li>Imágenes de alta calidad y relevantes al contenido</li>
                <li>Alt text descriptivo para accesibilidad</li>
              </ul>
            </section>

            <section>
              <h2 className="flex items-baseline gap-3 mb-4">
                <span className="font-display text-3xl font-black text-verde leading-none">06</span>
                <span className="font-display uppercase text-2xl font-extrabold tracking-[0.01em] text-foreground leading-none">Ética y conflictos de interés</span>
              </h2>
              <ul className="list-disc pl-6 space-y-2 marker:text-periwinkle">
                <li>No aceptamos pagos por cobertura editorial</li>
                <li>Identificamos claramente contenido patrocinado</li>
                <li>Divulgamos relaciones que puedan representar conflicto de interés</li>
                <li>Mantenemos separación entre contenido editorial y publicitario</li>
              </ul>
            </section>

            <section>
              <h2 className="flex items-baseline gap-3 mb-4">
                <span className="font-display text-3xl font-black text-verde leading-none">07</span>
                <span className="font-display uppercase text-2xl font-extrabold tracking-[0.01em] text-foreground leading-none">Comentarios de usuarios</span>
              </h2>
              <ul className="list-disc pl-6 space-y-2 marker:text-periwinkle">
                <li>Moderamos comentarios para mantener ambiente respetuoso</li>
                <li>No permitimos contenido ofensivo, discriminatorio o ilegal</li>
                <li>Los comentarios son responsabilidad de sus autores</li>
                <li>Nos reservamos el derecho de eliminar comentarios inapropiados</li>
              </ul>
            </section>

            <section>
              <h2 className="flex items-baseline gap-3 mb-4">
                <span className="font-display text-3xl font-black text-verde leading-none">08</span>
                <span className="font-display uppercase text-2xl font-extrabold tracking-[0.01em] text-foreground leading-none">Contacto editorial</span>
              </h2>
              <div className="rounded-[20px] border border-linea bg-superficie p-6 flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-texto font-semibold">
                    ¿Encontraste un error o tienes una sugerencia?
                  </p>
                  <p className="text-sm mt-1">
                    Escríbenos: respondemos consultas editoriales en un plazo de 48 horas.
                  </p>
                </div>
                <a href="mailto:latamconciertos@gmail.com" className="btn-nocturno-secundario shrink-0">
                  latamconciertos@gmail.com
                </a>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default EditorialGuidelines;
