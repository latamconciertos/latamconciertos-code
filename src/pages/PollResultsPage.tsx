import { Link, useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { PollResultsDashboard } from '@/components/polls/PollResultsDashboard';
import { usePollResults } from '@/hooks/queries/usePolls';

// Enlace privado de solo lectura para promotores: se comparte con el token, sin cuenta.
const PollResultsPage = () => {
  const { token } = useParams<{ token: string }>();
  const { data: results, isLoading, dataUpdatedAt } = usePollResults(token, 60_000);

  return (
    <div className="dark font-fira min-h-screen bg-noche text-texto flex flex-col">
      <SEO title={results ? `Resultados · ${results.poll.title}` : 'Resultados de encuesta'} noindex />
      <Header />
      <main className="flex-1 container mx-auto px-4 sm:px-6 pt-28 pb-16 max-w-6xl">
        {isLoading ? (
          <LoadingSpinnerInline message="Cargando resultados…" />
        ) : !results ? (
          <div className="rounded-[20px] border border-linea bg-superficie p-10 text-center space-y-4 max-w-lg mx-auto">
            <Lock className="h-8 w-8 text-fucsia mx-auto" />
            <h1 className="font-display font-black uppercase text-3xl text-texto">Enlace no válido</h1>
            <p className="text-texto-2 text-sm">Este enlace de resultados no existe o fue reemplazado. Pide uno nuevo al equipo de Conciertos Latam.</p>
            <Button asChild variant="outline" className="rounded-full border-linea bg-transparent hover:bg-superficie-2 text-texto">
              <Link to="/">Ir al inicio</Link>
            </Button>
          </div>
        ) : (
          <>
            <PollResultsDashboard
              results={results}
              updatedAt={dataUpdatedAt}
              subtitle={`Informe de audiencia preparado por Conciertos Latam${results.poll.festival ? ` · ${results.poll.festival.name}` : ''}`}
            />
            <p className="mt-8 text-xs text-texto-2 text-center">
              Datos agregados y anónimos. Este enlace es privado: compártelo solo con quien deba ver los resultados.
            </p>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default PollResultsPage;
