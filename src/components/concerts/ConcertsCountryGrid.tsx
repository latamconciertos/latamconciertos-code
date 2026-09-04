import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const COUNTRIES = [
  { name: 'Colombia', flag: '\u{1F1E8}\u{1F1F4}', slug: 'colombia' },
  { name: 'México', flag: '\u{1F1F2}\u{1F1FD}', slug: 'mexico' },
  { name: 'Argentina', flag: '\u{1F1E6}\u{1F1F7}', slug: 'argentina' },
  { name: 'Chile', flag: '\u{1F1E8}\u{1F1F1}', slug: 'chile' },
  { name: 'Perú', flag: '\u{1F1F5}\u{1F1EA}', slug: 'peru' },
  { name: 'Brasil', flag: '\u{1F1E7}\u{1F1F7}', slug: 'brasil' },
  { name: 'Ecuador', flag: '\u{1F1EA}\u{1F1E8}', slug: 'ecuador' },
  { name: 'Uruguay', flag: '\u{1F1FA}\u{1F1FE}', slug: 'uruguay' },
] as const;

export const ConcertsCountryGrid = () => {
  return (
    <section className="mt-16 pt-10 border-t border-linea" aria-label="Conciertos por país">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <span className="eyebrow-nocturno mb-3">Por país</span>
          <h3 className="font-display text-2xl md:text-3xl font-extrabold uppercase tracking-[0.01em] text-texto">
            Explora por país
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {COUNTRIES.map((country) => (
            <Link
              key={country.slug}
              to={`/conciertos/${country.slug}`}
              className="group"
            >
              <Card className="overflow-hidden rounded-[20px] border border-linea bg-superficie hover:border-[rgba(231,4,133,.35)] hover:bg-superficie-2 hover:-translate-y-1 transition-all duration-300">
                <CardContent className="p-4 text-center">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    {country.flag}
                  </div>
                  <p className="font-semibold text-sm text-texto group-hover:text-periwinkle transition-colors">
                    {country.name}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
