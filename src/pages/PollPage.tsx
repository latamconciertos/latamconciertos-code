import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Music, CheckCircle2, RotateCcw } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { PollForm } from '@/components/polls/PollForm';
import { usePublicPoll } from '@/hooks/queries/usePolls';
import { hasAnsweredPoll } from '@/lib/polls';
import type { PollChoice } from '@/types/entities/poll';

const PollPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('src') === 'stand' ? 'stand' : searchParams.get('src') === 'qr' ? 'qr' : 'web';
  const kiosk = source === 'stand';

  const { data: poll, isLoading } = usePublicPoll(slug);
  const [submitted, setSubmitted] = useState<PollChoice[] | null>(null);
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (slug && !kiosk) setAlreadyAnswered(hasAnsweredPoll(slug));
  }, [slug, kiosk]);

  const festivalName = poll?.festivals?.name ?? null;

  const resetForNext = () => {
    setSubmitted(null);
    setFormKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderBody = () => {
    if (isLoading) return <LoadingSpinnerInline message="Encendiendo las luces…" />;

    if (!poll) {
      return (
        <div className="text-center py-16 space-y-4">
          <Music className="h-10 w-10 text-fucsia mx-auto" />
          <h1 className="font-display font-black uppercase text-4xl text-texto">Esta encuesta no está activa</h1>
          <p className="text-texto-2">Todavía no hay nada por acá. Vuelve pronto.</p>
          <Button asChild variant="outline" className="rounded-full border-linea bg-transparent hover:bg-superficie-2 text-texto">
            <Link to="/">Ir al inicio</Link>
          </Button>
        </div>
      );
    }

    if (submitted || alreadyAnswered) {
      return (
        <div className="text-center py-10 space-y-6">
          <CheckCircle2 className="h-12 w-12 text-naranja mx-auto" />
          <div className="space-y-2">
            <h1 className="font-display font-black uppercase text-4xl md:text-5xl text-texto leading-none tracking-[0.01em]">
              ¡Listo, gracias!
            </h1>
            <p className="text-texto-2">
              {submitted
                ? 'Tu voto ya cuenta para el cartel soñado.'
                : 'Ya registraste tu respuesta desde este dispositivo.'}
            </p>
          </div>

          {submitted && (
            <ol className="max-w-sm mx-auto space-y-2 text-left">
              {submitted.map((c) => (
                <li key={c.position} className="flex items-center gap-3 rounded-[20px] border border-linea bg-superficie px-4 py-3">
                  <span className="font-display font-black text-3xl leading-none w-8 text-center text-naranja" aria-hidden="true">
                    {c.position}
                  </span>
                  {c.image_url ? (
                    <img src={c.image_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="h-10 w-10 rounded-full bg-superficie-2 flex items-center justify-center">
                      <Music className="h-4 w-4 text-texto-2" />
                    </span>
                  )}
                  <span className="font-medium text-texto truncate">{c.name}</span>
                </li>
              ))}
            </ol>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {kiosk ? (
              <Button
                type="button"
                onClick={resetForNext}
                className="h-12 rounded-full px-8 text-base font-semibold text-white bg-gradient-to-r from-morado to-fucsia"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Nueva respuesta
              </Button>
            ) : (
              <>
                <Button asChild className="h-12 rounded-full px-8 text-base font-semibold text-white bg-gradient-to-r from-morado to-fucsia">
                  <Link to="/concerts">Ver próximos conciertos</Link>
                </Button>
                <Button asChild variant="outline" className="h-12 rounded-full px-8 border-linea bg-transparent hover:bg-superficie-2 text-texto">
                  <Link to="/artists">Explorar artistas</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <PollForm
        key={formKey}
        poll={poll}
        source={source}
        kiosk={kiosk}
        onSubmitted={(choices) => {
          setSubmitted(choices);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  };

  return (
    <div className="dark font-fira min-h-screen bg-noche text-texto flex flex-col">
      <SEO
        title={poll ? `${poll.title} | Encuesta Conciertos Latam` : 'Encuesta | Conciertos Latam'}
        description={poll?.description ?? 'Cuéntanos a qué artistas quieres ver en la próxima edición.'}
        url={slug ? `https://conciertoslatam.app/encuestas/${slug}` : undefined}
        noindex={!poll}
      />
      <Header />

      <main className="flex-1 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[420px] w-[720px] rounded-full opacity-40 blur-[110px]"
          style={{ background: 'radial-gradient(circle, #7516E2 0%, transparent 70%)' }}
        />

        <div className="relative container mx-auto px-4 sm:px-6 pt-28 pb-16 max-w-2xl">
          {poll && !submitted && !alreadyAnswered && (
            <header className="mb-8">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-fucsia mb-3">
                <span className="inline-block h-0.5 w-6 bg-gradient-to-r from-morado via-fucsia to-naranja" aria-hidden="true" />
                {festivalName ?? 'Encuesta'}
              </p>
              <h1 className="font-display font-black uppercase text-4xl sm:text-5xl md:text-6xl leading-[0.95] tracking-[0.01em] text-texto">
                {poll.title}
              </h1>
              {poll.description && <p className="mt-4 text-base text-texto-2">{poll.description}</p>}
            </header>
          )}

          <section className="rounded-[20px] border border-linea bg-superficie/80 p-5 sm:p-8">
            {renderBody()}
          </section>

          {poll && !submitted && !alreadyAnswered && (
            <p className="mt-6 text-center text-xs text-texto-2">
              No pedimos nombre, correo ni teléfono. Las respuestas son anónimas y se usan de forma agregada.
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PollPage;
