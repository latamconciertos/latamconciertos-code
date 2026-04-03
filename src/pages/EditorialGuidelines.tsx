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
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Lineamientos Editoriales
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            En Conciertos Latam nos comprometemos con la excelencia periodística y la transparencia informativa.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardContent className="pt-6">
                <CheckCircle2 className="h-10 w-10 text-primary mb-4" />
                <h2 className="text-xl font-bold mb-2">Precisión</h2>
                <p className="text-muted-foreground text-sm">
                  Verificamos toda información antes de publicarla. Corregimos errores de manera transparente y oportuna.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <FileCheck className="h-10 w-10 text-primary mb-4" />
                <h2 className="text-xl font-bold mb-2">Fuentes Confiables</h2>
                <p className="text-muted-foreground text-sm">
                  Citamos fuentes oficiales, comunicados de prensa y verificamos información con múltiples fuentes cuando es posible.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Users className="h-10 w-10 text-primary mb-4" />
                <h2 className="text-xl font-bold mb-2">Independencia</h2>
                <p className="text-muted-foreground text-sm">
                  Mantenemos independencia editorial. Nuestro contenido no está influenciado por anunciantes o patrocinadores.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <AlertCircle className="h-10 w-10 text-primary mb-4" />
                <h2 className="text-xl font-bold mb-2">Transparencia</h2>
                <p className="text-muted-foreground text-sm">
                  Identificamos claramente contenido patrocinado y opinión. Corregimos errores visiblemente.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="prose prose-lg max-w-none space-y-8 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Estándares de Calidad</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-2">Verificación de Información</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Confirmamos fechas, lugares y detalles de eventos con fuentes oficiales</li>
                <li>Contactamos a organizadores y promotores para verificación</li>
                <li>Utilizamos múltiples fuentes cuando sea posible</li>
                <li>Etiquetamos información no confirmada claramente como "rumor" o "pendiente de confirmación"</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">Contenido Original</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Priorizamos contenido original y análisis propio</li>
                <li>Citamos apropiadamente cuando usamos información de otras fuentes</li>
                <li>Agregamos valor con contexto, análisis y perspectiva local</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Proceso Editorial</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-2">Redacción</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Títulos claros y precisos que reflejan el contenido</li>
                <li>Primer párrafo con información esencial (quién, qué, cuándo, dónde)</li>
                <li>Lenguaje claro y accesible para audiencia general</li>
                <li>Mínimo de 500 palabras para artículos de fondo</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">Revisión</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Revisión editorial antes de publicación</li>
                <li>Verificación de enlaces y fuentes</li>
                <li>Corrección ortográfica y gramatical</li>
                <li>Verificación de imágenes y derechos de uso</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Fuentes y Atribución</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Fuentes primarias:</strong> Comunicados oficiales, entrevistas directas, sitios web oficiales</li>
                <li><strong>Fuentes secundarias:</strong> Medios reconocidos, agencias de noticias, redes sociales verificadas</li>
                <li><strong>Atribución:</strong> Siempre citamos la fuente de información</li>
                <li><strong>Enlaces:</strong> Incluimos enlaces a fuentes cuando es posible</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Correcciones y Actualizaciones</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Correcciones menores:</strong> Se realizan de inmediato (errores tipográficos, fechas)</li>
                <li><strong>Correcciones significativas:</strong> Se nota al inicio del artículo con fecha de corrección</li>
                <li><strong>Actualizaciones:</strong> Artículos se actualizan cuando hay nueva información relevante</li>
                <li><strong>Transparencia:</strong> Mantenemos historial de cambios significativos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Imágenes y Multimedia</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Usamos solo imágenes con permisos apropiados</li>
                <li>Atribuimos créditos de fotógrafos y fuentes</li>
                <li>Imágenes de alta calidad y relevantes al contenido</li>
                <li>Alt text descriptivo para accesibilidad</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Ética y Conflictos de Interés</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>No aceptamos pagos por cobertura editorial</li>
                <li>Identificamos claramente contenido patrocinado</li>
                <li>Divulgamos relaciones que puedan representar conflicto de interés</li>
                <li>Mantenemos separación entre contenido editorial y publicitario</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Comentarios de Usuarios</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Moderamos comentarios para mantener ambiente respetuoso</li>
                <li>No permitimos contenido ofensivo, discriminatorio o ilegal</li>
                <li>Los comentarios son responsabilidad de sus autores</li>
                <li>Nos reservamos el derecho de eliminar comentarios inapropiados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Contacto Editorial</h2>
              <p>
                Si encuentras errores, tienes sugerencias o deseas contactar a nuestro equipo editorial:
              </p>
              <p className="mt-2">
                Email: <a href="mailto:latamconciertos@gmail.com" className="text-primary hover:underline">latamconciertos@gmail.com</a>
              </p>
              <p className="mt-2">
                Responderemos a consultas editoriales en un plazo de 48 horas.
              </p>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default EditorialGuidelines;
