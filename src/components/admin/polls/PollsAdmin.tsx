import { useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  BarChart3,
  Copy,
  ExternalLink,
  QrCode,
  ArrowLeft,
  Vote,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { PollFormDialog } from './PollFormDialog';
import { PollResultsDashboard } from '@/components/polls/PollResultsDashboard';
import { usePollsAdmin, useUpdatePoll, useDeletePoll, usePollResults } from '@/hooks/queries/usePolls';
import { pollPublicUrl, pollResultsUrl } from '@/lib/polls';
import type { PollWithRelations } from '@/types/entities/poll';

const copy = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  } catch {
    toast.error('No se pudo copiar. Selecciónalo manualmente.');
  }
};

const qrUrl = (data: string, size = 480) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=16&color=070D1F&bgcolor=FFFFFF&data=${encodeURIComponent(data)}`;

const PollResultsView = ({ poll, onBack }: { poll: PollWithRelations; onBack: () => void }) => {
  const token = poll.poll_share_links?.token;
  const { data: results, isLoading, dataUpdatedAt } = usePollResults(token, poll.is_active ? 30_000 : undefined);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="text-texto-2 hover:text-texto -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Volver a encuestas
      </Button>
      {isLoading ? (
        <LoadingSpinnerInline message="Cargando resultados…" />
      ) : results ? (
        <PollResultsDashboard results={results} updatedAt={dataUpdatedAt} />
      ) : (
        <p className="text-sm text-texto-2">No se pudieron cargar los resultados.</p>
      )}
    </div>
  );
};

export const PollsAdmin = () => {
  const { data: polls = [], isLoading } = usePollsAdmin();
  const updatePoll = useUpdatePoll();
  const deletePoll = useDeletePoll();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PollWithRelations | null>(null);
  const [deleting, setDeleting] = useState<PollWithRelations | null>(null);
  const [qrFor, setQrFor] = useState<PollWithRelations | null>(null);
  const [viewingResults, setViewingResults] = useState<PollWithRelations | null>(null);

  if (viewingResults) {
    return <PollResultsView poll={viewingResults} onBack={() => setViewingResults(null)} />;
  }

  const toggleActive = (poll: PollWithRelations, value: boolean) => {
    updatePoll.mutate(
      { id: poll.id, input: { is_active: value } },
      { onSuccess: () => toast.success(value ? 'Encuesta activada: ya aparece en el menú' : 'Encuesta desactivada') },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-fucsia mb-1">Gestión</p>
          <h1 className="font-display font-black uppercase text-4xl leading-none text-texto">Encuestas</h1>
          <p className="text-sm text-texto-2 mt-2">
            Top de artistas y perfil de audiencia por festival. Activa una para mostrarla en Experiencias.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="rounded-full bg-gradient-to-r from-morado to-fucsia text-white"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nueva encuesta
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinnerInline message="Cargando encuestas…" />
      ) : polls.length === 0 ? (
        <div className="rounded-[20px] border border-linea bg-superficie p-10 text-center space-y-3">
          <Vote className="h-8 w-8 text-fucsia mx-auto" />
          <p className="text-texto-2 text-sm">Todavía no hay encuestas. Crea la primera para el próximo festival.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {polls.map((poll) => {
            const token = poll.poll_share_links?.token;
            const publicUrl = pollPublicUrl(poll.slug);
            return (
              <li key={poll.id} className="rounded-[20px] border border-linea bg-superficie p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display font-black uppercase text-2xl leading-none text-texto truncate">
                        {poll.title}
                      </h2>
                      {poll.is_active ? (
                        <Badge className="rounded-full bg-transparent border border-naranja/50 text-naranja text-[10px] uppercase tracking-wider">
                          En vivo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-full border-linea text-texto-2 text-[10px] uppercase tracking-wider">
                          Inactiva
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-texto-2 mt-1.5 truncate">
                      {poll.festivals?.name ? `${poll.festivals.name} · ` : ''}
                      Top {poll.max_choices} · {poll.response_count ?? 0} respuestas · /encuestas/{poll.slug}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="flex items-center gap-2 text-xs text-texto-2 mr-2">
                      <Switch
                        checked={poll.is_active}
                        onCheckedChange={(v) => toggleActive(poll, v)}
                        disabled={updatePoll.isPending}
                        aria-label={`Activar ${poll.title}`}
                      />
                      Activa
                    </label>
                    <Button variant="outline" size="sm" onClick={() => setViewingResults(poll)} className="rounded-full border-linea bg-transparent hover:bg-superficie-2">
                      <BarChart3 className="h-4 w-4 mr-1.5" />
                      Resultados
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setQrFor(poll)} aria-label="Ver QR" className="text-texto-2 hover:text-texto">
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" asChild aria-label="Abrir encuesta" className="text-texto-2 hover:text-texto">
                      <a href={publicUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(poll);
                        setFormOpen(true);
                      }}
                      aria-label="Editar"
                      className="text-texto-2 hover:text-texto"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(poll)} aria-label="Eliminar" className="text-texto-2 hover:text-fucsia">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" onClick={() => copy(publicUrl, 'Enlace público')} className="h-8 text-xs text-texto-2 hover:text-texto">
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Enlace público
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => copy(pollPublicUrl(poll.slug, 'stand'), 'Enlace modo stand')} className="h-8 text-xs text-texto-2 hover:text-texto">
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Modo stand (tablet compartida)
                  </Button>
                  {token && (
                    <Button variant="ghost" size="sm" onClick={() => copy(pollResultsUrl(token), 'Enlace de resultados')} className="h-8 text-xs text-texto-2 hover:text-texto">
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Enlace de resultados para la promotora
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <PollFormDialog open={formOpen} onOpenChange={setFormOpen} poll={editing} />

      <Dialog open={!!qrFor} onOpenChange={(o) => !o && setQrFor(null)}>
        <DialogContent className="max-w-md bg-superficie border-linea">
          <DialogHeader>
            <DialogTitle className="font-display font-black uppercase text-2xl">QR de la encuesta</DialogTitle>
          </DialogHeader>
          {qrFor && (
            <div className="space-y-4 text-center">
              <img
                src={qrUrl(pollPublicUrl(qrFor.slug, 'qr'))}
                alt={`Código QR de ${qrFor.title}`}
                className="mx-auto w-64 h-64 rounded-[20px] bg-white p-2"
              />
              <p className="text-xs text-texto-2 break-all">{pollPublicUrl(qrFor.slug, 'qr')}</p>
              <Button asChild variant="outline" className="rounded-full border-linea bg-transparent hover:bg-superficie-2">
                <a href={qrUrl(pollPublicUrl(qrFor.slug, 'qr'), 1200)} target="_blank" rel="noreferrer" download={`qr-${qrFor.slug}.png`}>
                  Descargar en alta resolución
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="bg-superficie border-linea">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar "{deleting?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán también sus {deleting?.response_count ?? 0} respuestas. Esta acción no se puede deshacer.
              Los artistas creados desde la encuesta se conservan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) deletePoll.mutate(deleting.id, { onSettled: () => setDeleting(null) });
              }}
              className="bg-fucsia hover:bg-fucsia/90 text-white"
            >
              {deletePoll.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
