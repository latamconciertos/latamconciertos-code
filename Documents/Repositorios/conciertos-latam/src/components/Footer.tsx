import { Instagram, Twitter, Facebook, Youtube, MapPin, Mail, Phone } from 'lucide-react';
import footerLogo from '@/assets/footer-logo.png';

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-12">
          {/* Logo y descripción - 5 columns */}
          <div className="lg:col-span-5 text-center lg:text-center">
            <div className="mb-4 flex justify-center">
              <img src={footerLogo} alt="Conciertos Latam" className="h-28 w-auto" />
            </div>
            <p className="text-gray-400 mb-6 text-sm leading-relaxed max-w-md mx-auto">
              Descubre los mejores conciertos, festivales y eventos musicales de América Latina.
              Conectamos a los fanáticos con la música en vivo que aman.
            </p>

            {/* Social Media with hover effects */}
            <div className="flex gap-3 justify-center">
              <a
                href="#"
                className="group relative w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-primary transition-all duration-300 border border-gray-700/50 hover:border-primary"
              >
                <Instagram className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a
                href="#"
                className="group relative w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-primary transition-all duration-300 border border-gray-700/50 hover:border-primary"
              >
                <Twitter className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a
                href="#"
                className="group relative w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-primary transition-all duration-300 border border-gray-700/50 hover:border-primary"
              >
                <Facebook className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a
                href="#"
                className="group relative w-10 h-10 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-primary transition-all duration-300 border border-gray-700/50 hover:border-primary"
              >
                <Youtube className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          {/* Navigation Links - 7 columns split into 2 */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* Eventos */}
            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider relative inline-block">
                Eventos
                <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-primary to-transparent"></span>
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="/concerts" className="text-gray-400 hover:text-primary transition-colors text-sm flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    Conciertos
                  </a>
                </li>
                <li>
                  <a href="/artists" className="text-gray-400 hover:text-primary transition-colors text-sm flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    Artistas
                  </a>
                </li>
                <li>
                  <a href="/venues" className="text-gray-400 hover:text-primary transition-colors text-sm flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    Venues
                  </a>
                </li>
              </ul>
            </div>

            {/* Recursos */}
            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider relative inline-block">
                Recursos
                <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-primary to-transparent"></span>
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="/blog" className="text-gray-400 hover:text-primary transition-colors text-sm flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    Noticias
                  </a>
                </li>
                <li>
                  <a href="/setlists" className="text-gray-400 hover:text-primary transition-colors text-sm flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    Setlists
                  </a>
                </li>
                <li>
                  <a href="/promoters" className="text-gray-400 hover:text-primary transition-colors text-sm flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    Promotoras
                  </a>
                </li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider relative inline-block">
                Contacto
                <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-primary to-transparent"></span>
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="mailto:latamconciertos@gmail.com" className="text-gray-400 hover:text-primary transition-colors text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-xs">Email</span>
                  </a>
                </li>
                <li>
                  <a href="/about" className="text-gray-400 hover:text-primary transition-colors text-sm flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    Acerca de
                  </a>
                </li>
                <li>
                  <a href="/editorial-guidelines" className="text-gray-400 hover:text-primary transition-colors text-sm flex items-center group">
                    <span className="w-0 group-hover:w-2 h-0.5 bg-primary transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    Lineamientos
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Países Section with modern design */}
        <div className="relative py-8 mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800/30 to-transparent"></div>
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-4">
              <MapPin className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Países que Cubrimos</h4>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
              {['México', 'Colombia', 'Argentina', 'Chile', 'Perú', 'Brasil', 'Uruguay', 'Ecuador', 'Costa Rica', 'Guatemala', 'Panamá', 'República Dominicana'].map((country, index) => (
                <span key={index} className="text-gray-500 hover:text-primary transition-colors cursor-default">
                  {country}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative pt-8 border-t border-gray-800/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-xs">
              &copy; 2025 Conciertos Latam. Todos los derechos reservados.
            </p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-gray-500">
              <a href="/privacy" className="hover:text-primary transition-colors">Privacidad</a>
              <span className="text-gray-700">•</span>
              <a href="/terms" className="hover:text-primary transition-colors">Términos</a>
              <span className="text-gray-700">•</span>
              <a href="mailto:latamconciertos@gmail.com" className="hover:text-primary transition-colors">Contacto</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;