import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';

const TermsOfService = () => {
  return (
    <>
      <SEO
        title="Términos de Servicio"
        description="Términos y condiciones de uso de Conciertos Latam. Lee nuestras políticas sobre el uso del sitio y servicios."
        url="/terms"
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Términos de Servicio
          </h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <p className="text-sm text-muted-foreground">
              Última actualización: Enero 2025
            </p>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">1. Aceptación de Términos</h2>
              <p>
                Al acceder y usar Conciertos Latam, aceptas estar sujeto a estos Términos de Servicio y todas las leyes y regulaciones aplicables. Si no estás de acuerdo con alguno de estos términos, no uses nuestro sitio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">2. Uso del Servicio</h2>
              <p>
                Conciertos Latam proporciona información sobre conciertos, eventos musicales y noticias relacionadas. Te comprometes a:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Usar el sitio solo para propósitos legales</li>
                <li>No intentar acceder a áreas restringidas del sitio</li>
                <li>No interferir con el funcionamiento del sitio</li>
                <li>Proporcionar información precisa al crear una cuenta</li>
                <li>Mantener la confidencialidad de tu contraseña</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">3. Cuentas de Usuario</h2>
              <p>
                Para acceder a ciertas funciones, necesitas crear una cuenta. Eres responsable de:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Mantener la seguridad de tu cuenta</li>
                <li>Todas las actividades realizadas bajo tu cuenta</li>
                <li>Notificarnos inmediatamente de cualquier uso no autorizado</li>
              </ul>
              <p className="mt-3">
                Nos reservamos el derecho de suspender o eliminar cuentas que violen estos términos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">4. Contenido del Usuario</h2>
              <p>
                Al publicar contenido en Conciertos Latam (comentarios, reseñas, etc.):
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Mantienes los derechos de tu contenido</li>
                <li>Nos otorgas una licencia para usar, mostrar y distribuir tu contenido</li>
                <li>Garantizas que tienes derecho a compartir ese contenido</li>
                <li>El contenido no debe ser ilegal, difamatorio u ofensivo</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">5. Propiedad Intelectual</h2>
              <p>
                Todo el contenido en Conciertos Latam (textos, imágenes, logos, diseño) está protegido por derechos de autor y otras leyes de propiedad intelectual. No puedes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Reproducir contenido sin autorización</li>
                <li>Modificar o crear trabajos derivados</li>
                <li>Usar nuestro contenido con fines comerciales sin permiso</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">6. Información de Terceros</h2>
              <p>
                Conciertos Latam puede contener enlaces a sitios web de terceros y mostrar información sobre eventos organizados por terceros. No somos responsables de:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>El contenido de sitios externos</li>
                <li>Cambios en fechas, horarios o cancelaciones de eventos</li>
                <li>Problemas con la compra de entradas</li>
                <li>La calidad o realización de eventos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">7. Limitación de Responsabilidad</h2>
              <p>
                En la medida permitida por la ley, Conciertos Latam no será responsable de:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Daños directos, indirectos o consecuentes por el uso del sitio</li>
                <li>Errores u omisiones en el contenido</li>
                <li>Interrupciones del servicio</li>
                <li>Pérdida de datos o beneficios</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">8. Indemnización</h2>
              <p>
                Aceptas indemnizar y mantener indemne a Conciertos Latam de cualquier reclamo derivado de:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Tu uso del sitio</li>
                <li>Violación de estos términos</li>
                <li>Violación de derechos de terceros</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">9. Modificaciones del Servicio</h2>
              <p>
                Nos reservamos el derecho de modificar o discontinuar el servicio en cualquier momento, con o sin previo aviso. No seremos responsables ante ti ni terceros por cualquier modificación, suspensión o discontinuación del servicio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">10. Cambios a los Términos</h2>
              <p>
                Podemos actualizar estos términos ocasionalmente. El uso continuo del sitio después de cambios constituye tu aceptación de los nuevos términos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">11. Ley Aplicable</h2>
              <p>
                Estos términos se rigen por las leyes aplicables en América Latina. Cualquier disputa se resolverá en los tribunales competentes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">12. Contacto</h2>
              <p>
                Si tienes preguntas sobre estos términos, contáctanos en:
              </p>
              <p className="mt-2">
                Email: <a href="mailto:latamconciertos@gmail.com" className="text-primary hover:underline">latamconciertos@gmail.com</a>
              </p>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default TermsOfService;
