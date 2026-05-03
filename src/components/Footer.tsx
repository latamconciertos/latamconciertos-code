import { Instagram, Youtube, MapPin, Mail } from 'lucide-react';
import footerLogo from '@/assets/footer-logo.png';

// X (Twitter rebranded) — lucide doesn't ship an X icon yet
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-12 mb-10 md:mb-12">
          {/* Brand block — 5 cols on lg, full width centered on mobile */}
          <div className="lg:col-span-5 text-center lg:text-left">
            <div className="mb-4 flex justify-center lg:justify-start">
              <img
                src={footerLogo}
                alt="Conciertos Latam"
                className="h-20 md:h-24 w-auto"
                loading="lazy"
                decoding="async"
                width={96}
                height={96}
              />
            </div>
            <p className="text-gray-400 mb-5 text-sm leading-relaxed max-w-md mx-auto lg:mx-0">
              Descubre los mejores conciertos, festivales y eventos musicales de América Latina. Conectamos fanáticos con la música en vivo que aman.
            </p>
            <div className="flex gap-2.5 justify-center lg:justify-start">
              {[
                { Icon: Instagram, href: 'https://www.instagram.com/conciertos.latam', label: 'Instagram' },
                { Icon: TikTokIcon, href: 'https://www.tiktok.com/@conciertos.latam', label: 'TikTok' },
                { Icon: XIcon, href: 'https://x.com/ConciertoLatam', label: 'X' },
                { Icon: Youtube, href: 'https://www.youtube.com/@ConciertosLatam', label: 'YouTube' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group w-9 h-9 bg-gray-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-primary border border-gray-700/50 hover:border-primary transition-all duration-300"
                >
                  <Icon className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns — 7 cols on lg, 3-col grid that collapses to 2 on small */}
          <nav
            className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-8"
            aria-label="Footer"
          >
            <FooterColumn
              title="Eventos"
              items={[
                { href: '/concerts', label: 'Conciertos' },
                { href: '/artists', label: 'Artistas' },
                { href: '/festivals', label: 'Festivales' },
                { href: '/venues', label: 'Venues' },
              ]}
            />
            <FooterColumn
              title="Editorial"
              items={[
                { href: '/blog', label: 'Noticias' },
                { href: '/setlists', label: 'Setlists' },
                { href: '/promoters', label: 'Promotoras' },
              ]}
            />
            <FooterColumn
              title="Conciertos Latam"
              items={[
                { href: '/about', label: 'Acerca de' },
                { href: '/editorial-guidelines', label: 'Lineamientos' },
                { href: 'mailto:latamconciertos@gmail.com', label: 'Contacto', icon: <Mail className="h-3.5 w-3.5" /> },
              ]}
            />
          </nav>
        </div>

        {/* Conciertos por País */}
        <div className="relative py-7 md:py-8 mb-7 md:mb-8 border-t border-gray-800/50">
          <div className="flex items-center gap-2 mb-4 md:mb-5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <h4 className="text-[10px] sm:text-[11px] font-bold text-gray-300 uppercase tracking-[0.18em]">
              Conciertos por país
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
            {[
              { slug: 'colombia', name: 'Colombia' },
              { slug: 'mexico', name: 'México' },
              { slug: 'argentina', name: 'Argentina' },
              { slug: 'chile', name: 'Chile' },
              { slug: 'peru', name: 'Perú' },
              { slug: 'brasil', name: 'Brasil' },
              { slug: 'ecuador', name: 'Ecuador' },
              { slug: 'uruguay', name: 'Uruguay' },
              { slug: 'paraguay', name: 'Paraguay' },
              { slug: 'bolivia', name: 'Bolivia' },
              { slug: 'venezuela', name: 'Venezuela' },
              { slug: 'costa-rica', name: 'Costa Rica' },
              { slug: 'panama', name: 'Panamá' },
              { slug: 'guatemala', name: 'Guatemala' },
              { slug: 'republica-dominicana', name: 'Rep. Dominicana' },
              { slug: 'puerto-rico', name: 'Puerto Rico' },
            ].map((c) => (
              <a
                key={c.slug}
                href={`/conciertos/${c.slug}`}
                aria-label={`Conciertos en ${c.name}`}
                className="px-3 py-2 text-center rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.12em] bg-gray-800/60 border border-gray-700/50 text-gray-400 hover:text-white hover:border-primary/60 hover:bg-gray-800 transition-colors truncate"
              >
                {c.name}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative pt-6 md:pt-8 border-t border-gray-800/50">
          <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-[11px] md:text-xs text-center md:text-left">
              &copy; {new Date().getFullYear()} Conciertos Latam. Todos los derechos reservados.
            </p>
            <div className="flex flex-wrap justify-center gap-x-3 sm:gap-x-4 gap-y-1 text-[11px] md:text-xs text-gray-500">
              <a href="/privacy" className="hover:text-primary transition-colors">Privacidad</a>
              <span className="text-gray-700" aria-hidden="true">·</span>
              <a href="/terms" className="hover:text-primary transition-colors">Términos</a>
              <span className="text-gray-700" aria-hidden="true">·</span>
              <a href="mailto:latamconciertos@gmail.com" className="hover:text-primary transition-colors">Contacto</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

interface FooterColumnProps {
  title: string;
  items: Array<{ href: string; label: string; icon?: React.ReactNode }>;
}

function FooterColumn({ title, items }: FooterColumnProps) {
  return (
    <div>
      <h4 className="text-white font-bold mb-4 text-[11px] sm:text-xs uppercase tracking-[0.18em] relative inline-block">
        {title}
        <span
          aria-hidden="true"
          className="absolute -bottom-1.5 left-0 w-6 h-0.5 bg-gradient-to-r from-primary to-transparent"
        />
      </h4>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="text-gray-400 hover:text-primary transition-colors text-sm flex items-center gap-2 group"
            >
              {item.icon ? (
                <span className="text-gray-500 group-hover:text-primary transition-colors">
                  {item.icon}
                </span>
              ) : (
                <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary transition-all duration-300" />
              )}
              <span className="truncate">{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Footer;