import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';

const PrivacyPolicy = () => {
  return (
    <>
      <SEO
        title="Política de Privacidad"
        description="Política de privacidad de Conciertos Latam. Información sobre cómo recolectamos, usamos y protegemos tus datos personales."
        url="/privacy"
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Política de Privacidad
          </h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <p className="text-sm text-muted-foreground">
              Última actualización: Enero 2025
            </p>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">1. Información que Recolectamos</h2>
              <p>
                En Conciertos Latam recolectamos la siguiente información:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Información de cuenta:</strong> Nombre de usuario, correo electrónico y contraseña cuando creas una cuenta.</li>
                <li><strong>Información de uso:</strong> Datos sobre cómo utilizas nuestro sitio, incluyendo páginas visitadas y eventos de interés.</li>
                <li><strong>Información técnica:</strong> Dirección IP, tipo de navegador, sistema operativo y datos de cookies.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">2. Cómo Usamos tu Información</h2>
              <p>Utilizamos tu información para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Proporcionar y mejorar nuestros servicios</li>
                <li>Personalizar tu experiencia en el sitio</li>
                <li>Enviarte notificaciones sobre eventos de tu interés</li>
                <li>Analizar el uso del sitio y mejorar el contenido</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">3. Cookies</h2>
              <p>
                Utilizamos cookies y tecnologías similares para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Mantener tu sesión activa</li>
                <li>Recordar tus preferencias</li>
                <li>Analizar el tráfico del sitio</li>
                <li>Mostrar contenido personalizado</li>
              </ul>
              <p className="mt-3">
                Puedes configurar tu navegador para rechazar cookies, aunque esto puede afectar algunas funcionalidades del sitio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">4. Compartir Información</h2>
              <p>
                No vendemos tu información personal. Podemos compartir datos con:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Proveedores de servicios:</strong> Para operación del sitio y análisis</li>
                <li><strong>Autoridades legales:</strong> Cuando sea requerido por ley</li>
                <li><strong>Socios comerciales:</strong> Con tu consentimiento explícito</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">5. Seguridad de Datos</h2>
              <p>
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal contra acceso no autorizado, alteración, divulgación o destrucción.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">6. Tus Derechos</h2>
              <p>Tienes derecho a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Acceder a tu información personal</li>
                <li>Corregir datos inexactos</li>
                <li>Solicitar la eliminación de tu cuenta</li>
                <li>Oponerte al procesamiento de tus datos</li>
                <li>Exportar tus datos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">7. Retención de Datos</h2>
              <p>
                Conservamos tu información personal mientras tu cuenta esté activa o según sea necesario para proporcionar nuestros servicios. Después de la eliminación de cuenta, algunos datos pueden conservarse por requisitos legales.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">8. Menores de Edad</h2>
              <p>
                Nuestros servicios no están dirigidos a menores de 13 años. No recolectamos intencionalmente información de niños menores de 13 años.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">9. Cambios a esta Política</h2>
              <p>
                Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos sobre cambios significativos publicando la nueva política en esta página y actualizando la fecha de "Última actualización".
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">10. Contacto</h2>
              <p>
                Si tienes preguntas sobre esta política de privacidad, contáctanos en:
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

export default PrivacyPolicy;
