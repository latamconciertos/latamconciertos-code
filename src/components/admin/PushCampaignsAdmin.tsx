import { useState } from 'react';
import { Bell, Send, History, Loader2, Ticket, X, Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useCountryOptions } from '@/hooks/queries/useGeography';
import { useArtistSearch } from '@/hooks/queries/useArtists';
import {
  usePushCampaigns,
  useCreateAndSendCampaign,
  useConcertSearch,
  type PushCampaignInput,
  type ConcertSearchResult,
} from '@/hooks/queries/usePushCampaigns';
import { toast } from 'sonner';
import { formatDisplayDate } from '@/lib/timezone';

export const PushCampaignsAdmin = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [audienceType, setAudienceType] = useState<'all' | 'country' | 'artist'>('all');
  const [countryId, setCountryId] = useState<string>('');
  const [artistId, setArtistId] = useState<string>('');
  const [artistSearch, setArtistSearch] = useState('');

  const [linkedConcert, setLinkedConcert] = useState<ConcertSearchResult | null>(null);
  const [concertSearch, setConcertSearch] = useState('');
  const [showConcertResults, setShowConcertResults] = useState(false);

  const { data: countries = [] } = useCountryOptions();
  const { data: artistResults = [] } = useArtistSearch(artistSearch, 10);
  const { data: concertResults = [] } = useConcertSearch(concertSearch, 8);
  const { data: campaigns = [], isLoading } = usePushCampaigns();
  const createCampaign = useCreateAndSendCampaign();

  const handleSelectConcert = (concert: ConcertSearchResult) => {
    setLinkedConcert(concert);
    setShowConcertResults(false);
    setConcertSearch('');

    // Auto-fill title/body/URL — user can still edit
    const artistName = concert.artists?.name;
    const venueName = concert.venues?.name;
    const cityName = concert.venues?.cities?.name;
    const dateStr = concert.date
      ? new Date(concert.date + 'T12:00:00').toLocaleDateString('es', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null;

    const suggestedTitle = artistName ? `🎤 ${artistName} en LATAM` : `🎤 ${concert.title}`;
    const suggestedBodyParts = [
      concert.title,
      [dateStr, venueName, cityName].filter(Boolean).join(' · '),
    ].filter(Boolean);

    setTitle(suggestedTitle);
    setBody(suggestedBodyParts.join('\n'));
    setUrl(`/concerts/${concert.slug}`);

    // If the concert has an artist, switch audience to artist auto-targeted
    if (concert.artist_id) {
      setAudienceType('artist');
      setArtistId(concert.artist_id);
      setArtistSearch(artistName ?? '');
    }
  };

  const handleClearConcert = () => {
    setLinkedConcert(null);
    setConcertSearch('');
    // Don't clear the form fields — user might want to keep their edits
  };

  const audienceLabel = (() => {
    if (audienceType === 'all') return 'Todos los suscritos';
    if (audienceType === 'country' && countryId) {
      return `País: ${countries.find((c) => c.id === countryId)?.name || ''}`;
    }
    if (audienceType === 'artist' && artistId) {
      return `Fans de: ${artistResults.find((a) => a.id === artistId)?.name || ''}`;
    }
    return 'Selecciona audiencia';
  })();

  const canSend =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    (audienceType === 'all' ||
      (audienceType === 'country' && !!countryId) ||
      (audienceType === 'artist' && !!artistId));

  const handleSend = async () => {
    let audience: PushCampaignInput['audience'];
    if (audienceType === 'all') audience = { type: 'all' };
    else if (audienceType === 'country') audience = { type: 'country', countryId };
    else audience = { type: 'artist', artistId };

    try {
      const res = await createCampaign.mutateAsync({
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || null,
        concert_id: linkedConcert?.id ?? null,
        audience,
      });
      const r = res.result;
      if (r.recipientCount === 0) {
        toast.warning(`Sin destinatarios (audiencia sin suscritos a push)`);
      } else {
        toast.success(`Campaña enviada · ${r.sent} entregadas, ${r.failed} fallidas de ${r.recipientCount}`);
      }
      setTitle('');
      setBody('');
      setUrl('');
      setLinkedConcert(null);
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo enviar la campaña');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notificaciones Push</h2>
        <p className="text-muted-foreground">Enviá alertas push a los fans suscritos del sitio.</p>
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList>
          <TabsTrigger value="compose" className="gap-1.5">
            <Send className="h-3.5 w-3.5" /> Componer
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-3.5 w-3.5" /> Historial
          </TabsTrigger>
        </TabsList>

        {/* Compose: 2-col layout — form left, sticky preview/CTA right on desktop */}
        <TabsContent value="compose" className="space-y-0">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-x-10 gap-y-8">
            {/* FORM */}
            <div className="space-y-8 max-w-xl">
              {/* Concert link */}
              <FormSection
                title="Vincular concierto"
                hint="Opcional. Autocompleta título, cuerpo, URL y segmenta a los fans del artista."
              >
                {linkedConcert ? (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 px-3.5 py-3 flex items-start gap-3">
                    <Ticket className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      {linkedConcert.artists?.name && (
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                          {linkedConcert.artists.name}
                        </p>
                      )}
                      <p className="text-sm font-semibold truncate">{linkedConcert.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[
                          linkedConcert.date
                            ? new Date(linkedConcert.date + 'T12:00:00').toLocaleDateString('es', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : null,
                          linkedConcert.venues?.name,
                          linkedConcert.venues?.cities?.name,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={handleClearConcert}
                      aria-label="Quitar vínculo con concierto"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <SearchIcon className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      value={concertSearch}
                      onChange={(e) => {
                        setConcertSearch(e.target.value);
                        setShowConcertResults(true);
                      }}
                      onFocus={() => setShowConcertResults(true)}
                      placeholder="Buscar concierto…"
                      className="pl-9 h-10 text-sm"
                    />
                    {showConcertResults && concertSearch.trim().length >= 2 && concertResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg divide-y divide-border/50">
                        {concertResults.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectConcert(c)}
                            className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors"
                          >
                            {c.artists?.name && (
                              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                                {c.artists.name}
                              </p>
                            )}
                            <p className="text-sm font-semibold truncate">{c.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {[
                                c.date
                                  ? new Date(c.date + 'T12:00:00').toLocaleDateString('es', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : null,
                                c.venues?.name,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                    {showConcertResults &&
                      concertSearch.trim().length >= 2 &&
                      concertResults.length === 0 && (
                        <p className="mt-1.5 text-xs text-muted-foreground italic">
                          Sin resultados para "{concertSearch}"
                        </p>
                      )}
                  </div>
                )}
              </FormSection>

              {/* Mensaje */}
              <FormSection title="Mensaje">
                <FieldLabel htmlFor="push-title">
                  Título
                  <FieldCount value={title.length} max={60} />
                </FieldLabel>
                <Input
                  id="push-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Bad Bunny vuelve a Colombia 🎤"
                  maxLength={120}
                  className="h-10 text-sm"
                />

                <div className="pt-1" />

                <FieldLabel htmlFor="push-body">
                  Cuerpo
                  <FieldCount value={body.length} max={160} />
                </FieldLabel>
                <Textarea
                  id="push-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="3 fechas confirmadas en Bogotá. Entradas a la venta el viernes."
                  rows={3}
                  maxLength={300}
                  className="text-sm resize-none"
                />

                <div className="pt-1" />

                <FieldLabel htmlFor="push-url">URL al hacer click</FieldLabel>
                <Input
                  id="push-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="/concerts/bad-bunny-bogota-2026"
                  className="h-10 text-sm font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Path relativo (<code className="text-foreground">/concerts/…</code>) o URL completa.
                </p>
              </FormSection>

              {/* Audiencia */}
              <FormSection title="Audiencia">
                <div className="flex items-center gap-1 border-b border-border/60">
                  {(
                    [
                      { v: 'all', label: 'Todos' },
                      { v: 'country', label: 'Por país' },
                      { v: 'artist', label: 'Por artista' },
                    ] as const
                  ).map(({ v, label }) => {
                    const isActive = audienceType === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAudienceType(v)}
                        className={
                          'relative px-4 py-2.5 text-xs font-semibold transition-colors ' +
                          (isActive
                            ? 'text-foreground'
                            : 'text-muted-foreground hover:text-foreground')
                        }
                        aria-pressed={isActive}
                      >
                        {label}
                        <span
                          aria-hidden="true"
                          className={
                            'absolute left-0 right-0 -bottom-px h-0.5 transition-colors ' +
                            (isActive ? 'bg-primary' : 'bg-transparent')
                          }
                        />
                      </button>
                    );
                  })}
                </div>

                {audienceType === 'country' && (
                  <div className="pt-3">
                    <FieldLabel>País</FieldLabel>
                    <Select value={countryId} onValueChange={setCountryId}>
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Seleccionar país" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {audienceType === 'artist' && (
                  <div className="pt-3 space-y-2">
                    <FieldLabel>Buscar artista</FieldLabel>
                    <Input
                      value={artistSearch}
                      onChange={(e) => setArtistSearch(e.target.value)}
                      placeholder="Bad Bunny, Karol G…"
                      className="h-10 text-sm"
                    />
                    {artistResults.length > 0 && artistSearch && !artistId && (
                      <div className="max-h-44 overflow-y-auto rounded-lg border border-border/60 divide-y divide-border/50">
                        {artistResults.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              setArtistId(a.id);
                              setArtistSearch(a.name);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted/40 transition-colors"
                          >
                            {a.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {artistId && (
                      <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 flex items-center justify-between">
                        <span className="text-sm">
                          <span className="text-muted-foreground">Seleccionado: </span>
                          <span className="font-semibold text-foreground">
                            {artistResults.find((a) => a.id === artistId)?.name || artistSearch}
                          </span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setArtistId('');
                            setArtistSearch('');
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </FormSection>
            </div>

            {/* PREVIEW + CTA — sticky right column on desktop */}
            <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  Vista previa
                </p>
                <div className="rounded-xl bg-card border border-border/60 p-3.5 shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
                      <Bell className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">
                        {title || 'Título de la notificación'}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-3 mt-0.5">
                        {body || 'Cuerpo del mensaje'}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                        Conciertos Latam · ahora
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted/40 border border-border/60 px-3 py-2.5 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Audiencia
                </p>
                <p className="text-sm text-foreground">{audienceLabel}</p>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={!canSend || createCampaign.isPending}
                    size="lg"
                    className="w-full gap-2"
                  >
                    {createCampaign.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Enviar campaña
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Enviar push ahora?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se va a enviar a: <strong>{audienceLabel}</strong>. Esta acción no se puede deshacer — los push se entregan instantáneamente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSend}>Enviar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </aside>
          </div>
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Aún no se ha enviado ninguna campaña.
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">Fecha</th>
                    <th className="text-left px-4 py-3">Título</th>
                    <th className="text-left px-4 py-3">Audiencia</th>
                    <th className="text-right px-4 py-3">Destinatarios</th>
                    <th className="text-right px-4 py-3">Entregadas</th>
                    <th className="text-right px-4 py-3">Fallidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {c.sent_at ? formatDisplayDate(c.sent_at) : formatDisplayDate(c.created_at)}
                      </td>
                      <td className="px-4 py-3 max-w-[280px]">
                        <p className="font-semibold text-foreground truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{c.body}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                          {c.audience.type === 'all'
                            ? 'Todos'
                            : c.audience.type === 'country'
                              ? 'País'
                              : 'Artista'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono text-xs">{c.recipient_count}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono text-xs text-emerald-500">{c.sent_count}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-mono text-xs text-rose-500">{c.failed_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// — Helpers for form layout —

function FormSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-xs font-medium text-muted-foreground flex items-center justify-between mb-1.5"
    >
      {children}
    </Label>
  );
}

function FieldCount({ value, max }: { value: number; max: number }) {
  const over = value > max;
  return (
    <span
      className={
        over
          ? 'text-[10px] font-medium tabular-nums text-amber-500'
          : 'text-[10px] font-medium tabular-nums text-muted-foreground/60'
      }
    >
      {value}/{max}
    </span>
  );
}
