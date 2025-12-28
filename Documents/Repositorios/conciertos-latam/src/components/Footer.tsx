import { Instagram, Twitter, Facebook, Youtube, Mail } from 'lucide-react';
import footerLogo from '@/assets/footer-logo.png';
const Footer = () => {
  return <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="lg:col-span-2 text-center md:text-left">
            <div className="flex justify-center md:justify-start mb-4">
              <img src={footerLogo} alt="Conciertos Latam" className="h-20 w-auto" />
            </div>
            <p className="text-gray-300 mb-5 max-w-md text-sm mx-auto md:mx-0">
              Descubre los mejores conciertos, festivales y eventos musicales de América Latina. 
              Conectamos a los fanáticos con la música en vivo que aman.
            </p>
            <div className="flex justify-center md:justify-start space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos - Menú principal */}
          <div>
            <h4 className="text-base font-semibold mb-3">Explora</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/concerts" className="text-gray-300 hover:text-primary transition-colors">Conciertos</a></li>
              <li><a href="/blog" className="text-gray-300 hover:text-primary transition-colors">Noticias</a></li>
              <li><a href="/artists" className="text-gray-300 hover:text-primary transition-colors">Artistas</a></li>
              <li><a href="/setlists" className="text-gray-300 hover:text-primary transition-colors">Setlists</a></li>
              <li><a href="/promoters" className="text-gray-300 hover:text-primary transition-colors">Promotoras</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-base font-semibold mb-3">Newsletter</h4>
            <p className="text-gray-300 mb-4 text-sm">
              Recibe las últimas noticias y eventos en tu email.
            </p>
            <div className="flex">
              <input type="email" placeholder="Tu email" className="flex-1 px-3 py-2 text-sm bg-gray-800 text-white rounded-l-lg border border-gray-700 focus:outline-none focus:border-primary" />
              <button className="bg-primary px-4 py-2 rounded-r-lg hover:bg-primary/90 transition-colors">
                <Mail className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Países */}
        <div className="mt-10 pt-6 border-t border-gray-800">
          <h4 className="text-sm font-semibold mb-3 text-center">Países que Cubrimos</h4>
          <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-400">
            <span>México</span>
            <span>•</span>
            <span>Colombia</span>
            <span>•</span>
            <span>Argentina</span>
            <span>•</span>
            <span>Chile</span>
            <span>•</span>
            <span>Perú</span>
            <span>•</span>
            <span>Brasil</span>
            <span>•</span>
            <span>Uruguay</span>
            <span>•</span>
            <span>Ecuador</span>
            <span>•</span>
            <span>Costa Rica</span>
            <span>•</span>
            <span>Guatemala</span>
            <span>•</span>
            <span>Panamá</span>
            <span>•</span>
            <span>República Dominicana</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-gray-800 text-center text-gray-400 text-xs">
          <p>&copy; 2025 Conciertos Latam. Todos los derechos reservados.</p>
          <div className="mt-2 space-x-3">
            <a href="/about" className="hover:text-primary transition-colors">Acerca de</a>
            <span>•</span>
            <a href="/privacy" className="hover:text-primary transition-colors">Privacidad</a>
            <span>•</span>
            <a href="/terms" className="hover:text-primary transition-colors">Términos</a>
            <span>•</span>
            <a href="/editorial-guidelines" className="hover:text-primary transition-colors">Lineamientos</a>
            <span>•</span>
            <a href="mailto:latamconciertos@gmail.com" className="hover:text-primary transition-colors">Contacto</a>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;