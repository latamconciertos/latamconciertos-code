import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { StagedEventsList } from './StagedEventsList';
import { IngestionSourcesTab } from './IngestionSourcesTab';
import { IngestionRunsTab } from './IngestionRunsTab';
import { useStagedCounts } from '@/hooks/queries/useIngestion';

const tabTriggerClass =
  'rounded-full px-4 data-[state=inactive]:text-texto-2 data-[state=inactive]:hover:text-texto ' +
  'data-[state=active]:bg-[linear-gradient(95deg,#7516E2,#E70485)] data-[state=active]:text-white ' +
  'data-[state=active]:shadow-[0_4px_16px_rgba(117,22,226,.35)]';

export const IngestionAdmin = () => {
  const { data: counts } = useStagedCounts();

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-azul-claro">
          <span className="h-0.5 w-6 rounded-full bg-verde" aria-hidden />
          Catálogo
        </p>
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-[0.01em] text-texto">
          Ingesta de eventos
        </h2>
        <p className="mt-1 text-sm text-texto-2">
          Eventos extraídos de ticketeras y venues. Revisa y aprueba para publicarlos en el catálogo.
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="h-auto rounded-full border border-linea bg-superficie p-1.5">
          <TabsTrigger value="pending" className={`gap-2 ${tabTriggerClass}`}>
            Pendientes
            {counts?.pending ? (
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-400">
                {counts.pending}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="discarded" className={tabTriggerClass}>Descartados</TabsTrigger>
          <TabsTrigger value="sources" className={tabTriggerClass}>Fuentes</TabsTrigger>
          <TabsTrigger value="runs" className={tabTriggerClass}>Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <StagedEventsList status="pending" />
        </TabsContent>
        <TabsContent value="discarded" className="mt-4">
          <StagedEventsList status="discarded" />
        </TabsContent>
        <TabsContent value="sources" className="mt-4">
          <IngestionSourcesTab />
        </TabsContent>
        <TabsContent value="runs" className="mt-4">
          <IngestionRunsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
