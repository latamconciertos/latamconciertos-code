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
        <h2 className="page-title">Notificaciones Push</h2>
        <p className="page-subtitle">Enviá alertas push a los fans suscritos del sitio.</p>
      </div>

      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compose" className="gap-1.5">
            <Send className="h-3.5 w-3.5" /> Componer
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-3.5 w-3.5" /> Historial
          </TabsTrigger>
        </TabsList>

        {/* Compose */}
        <TabsContent value="compose" className="space-y-5 max-w-2xl">
          {/* Concert link picker — auto-fills the form */}
          <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
            <Label className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary block">
              Vincular concierto <span className="text-muted-foreground/70 normal-case font-medium tracking-normal">(opcional)</span>
            </Label>

            {linkedConcert ? (
              <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-3 flex items-start gap-3">
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
                <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={concertSearch}
                  onChange={(e) => {
                    setConcertSearch(e.target.value);
                    setShowConcertResults(true);
                  }}
                  onFocus={() => setShowConcertResults(true)}
                  placeholder="Buscar concierto por título..."
                  className="pl-9"
                />
                {showConcertResults && concertSearch.trim().length >= 2 && concertResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-h-72 overflow-y-auto rounded-md border border-border bg-popover shadow-lg divide-y divide-border/50">
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
                    <p className="mt-2 text-xs text-muted-foreground italic">
                      Sin resultados para "{concertSearch}"
                    </p>
                  )}
                <p className="text-[10px] text-muted-foreground/70 mt-2">
                  Al seleccionar un concierto se autocompleta el título, cuerpo, URL y se segmenta a los fans del artista.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5 space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Mensaje
              </Label>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="push-title" className="text-xs text-muted-foreground">
                    Título <span className="text-muted-foreground/50">({title.length}/60 recomendado)</span>
                  </Label>
                  <Input
                    id="push-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Bad Bunny vuelve a Colombia 🎤"
                    maxLength={120}
                  />
                </div>
                <div>
                  <Label htmlFor="push-body" className="text-xs text-muted-foreground">
                    Cuerpo <span className="text-muted-foreground/50">({body.length}/160 recomendado)</span>
                  </Label>
                  <Textarea
                    id="push-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="3 fechas confirmadas en Bogotá. Entradas a la venta el viernes."
                    rows={3}
                    maxLength={300}
                  />
                </div>
                <div>
                  <Label htmlFor="push-url" className="text-xs text-muted-foreground">
                    URL al hacer click (opcional)
                  </Label>
                  <Input
                    id="push-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="/concerts/bad-bunny-bogota-2026"
                  />
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    Path relativo (ej. <code>/concerts/...</code>) o URL completa
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary block">
              Audiencia
            </Label>

            <div className="grid grid-cols-3 gap-2">
              {(['all', 'country', 'artist'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAudienceType(t)}
                  className={
                    audienceType === t
                      ? 'rounded-md border-2 border-primary bg-primary/5 px-3 py-2.5 text-xs font-semibold transition-colors'
                      : 'rounded-md border border-border/60 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:border-border transition-colors'
                  }
                >
                  {t === 'all' ? 'Todos' : t === 'country' ? 'Por país' : 'Por artista'}
                </button>
              ))}
            </div>

            {audienceType === 'country' && (
              <div>
                <Label className="text-xs text-muted-foreground">País</Label>
                <Select value={countryId} onValueChange={setCountryId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar país" /></SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {audienceType === 'artist' && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Buscar artista</Label>
                <Input
                  value={artistSearch}
                  onChange={(e) => setArtistSearch(e.target.value)}
                  placeholder="Bad Bunny, Karol G..."
                />
                {artistResults.length > 0 && artistSearch && (
                  <div className="max-h-44 overflow-y-auto rounded-md border border-border/60 divide-y divide-border/50">
                    {artistResults.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setArtistId(a.id);
                          setArtistSearch(a.name);
                        }}
                        className={
                          'w-full text-left px-3 py-2 text-sm hover:bg-muted/40 transition-colors ' +
                          (artistId === a.id ? 'bg-primary/10 text-primary font-semibold' : '')
                        }
                      >
                        {a.name}
                      </button>
                    ))}
                  </div>
                )}
                {artistId && (
                  <p className="text-xs text-muted-foreground">
                    Seleccionado: <span className="font-semibold text-foreground">{artistResults.find((a) => a.id === artistId)?.name || artistSearch}</span>
                  </p>
                )}
              </div>
            )}

            <div className="rounded-md bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Audiencia: </span>{audienceLabel}
            </div>
          </div>

          {/* Preview */}
          {(title || body) && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-5">
              <Label className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary block mb-3">
                Vista previa
              </Label>
              <div className="rounded-lg bg-background border border-border/60 p-3 max-w-sm">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
                    <Bell className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">
                      {title || 'Título de la notificación'}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {body || 'Cuerpo del mensaje'}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">Conciertos Latam · ahora</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={!canSend || createCampaign.isPending} size="lg" className="gap-2">
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
                    Se va a enviar a: <strong>{audienceLabel}</strong>. Esta acción no se puede deshacer — los push notifications se entregan instantáneamente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSend}>Enviar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
