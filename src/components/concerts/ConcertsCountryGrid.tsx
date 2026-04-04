import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
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
    <section className="mt-16 pt-8 border-t border-border/50" aria-label="Conciertos por país">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-8">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold text-foreground">Explora por País</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {COUNTRIES.map((country) => (
            <Link
              key={country.slug}
              to={`/conciertos/${country.slug}`}
              className="group"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-primary/50">
                <CardContent className="p-4 text-center">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    {country.flag}
                  </div>
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors">
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
