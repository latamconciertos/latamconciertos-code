import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, Vote } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { useActivePolls } from '@/hooks/queries/usePolls';

const PollsIndex = () => {
  const { data: polls = [], isLoading } = useActivePolls();

  if (!isLoading && polls.length === 1) {
    return <Navigate to={`/encuestas/${polls[0].slug}`} replace />;
  }

  return (
    <div className="dark font-fira min-h-screen bg-noche text-texto flex flex-col">
      <SEO
        title="Encuestas | Conciertos Latam"
        description="Dinos a quién quieres ver en los próximos festivales de Latinoamérica."
        url="https://conciertoslatam.app/encuestas"
        noindex={polls.length === 0}
      />
      <Header />
      <main className="flex-1 container mx-auto px-4 sm:px-6 pt-28 pb-16 max-w-3xl">
        <header className="mb-8">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-fucsia mb-3">
            <span className="inline-block h-0.5 w-6 bg-gradient-to-r from-morado via-fucsia to-naranja" aria-hidden="true" />
            Experiencias
          </p>
          <h1 className="font-display font-black uppercase text-5xl md:text-6xl leading-[0.95] tracking-[0.01em]">
            Encuestas
          </h1>
          <p className="mt-3 text-texto-2">Tu voz decide el cartel. Elige tus artistas y cuéntanos quién eres.</p>
        </header>

        {isLoading ? (
          <LoadingSpinnerInline message="Encendiendo las luces…" />
        ) : polls.length === 0 ? (
          <div className="rounded-[20px] border border-linea bg-superficie p-10 text-center space-y-3">
            <Vote className="h-8 w-8 text-fucsia mx-auto" />
            <p className="text-texto-2">Todavía no hay encuestas abiertas. Vuelve pronto.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {polls.map((poll) => (
              <li key={poll.id}>
                <Link
                  to={`/encuestas/${poll.slug}`}
                  className="group flex items-center gap-4 rounded-[20px] border border-linea bg-superficie p-5 transition-all hover:-translate-y-1 hover:border-fucsia/35 hover:shadow-[0_20px_50px_rgba(0,0,0,.5)]"
                >
                  <div className="min-w-0 flex-1">
                    {poll.festivals?.name && (
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fucsia mb-1">
                        {poll.festivals.name}
                      </p>
                    )}
                    <h2 className="font-display font-black uppercase text-2xl leading-none text-texto truncate">
                      {poll.title}
                    </h2>
                    {poll.description && <p className="text-sm text-texto-2 mt-1 line-clamp-2">{poll.description}</p>}
                  </div>
                  <ArrowRight className="h-5 w-5 text-fucsia shrink-0 transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default PollsIndex;
