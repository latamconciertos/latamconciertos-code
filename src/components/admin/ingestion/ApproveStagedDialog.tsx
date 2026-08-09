import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, ExternalLink, Sparkles, Calendar, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { slugify } from '@/lib/slugify';
import { useCreateConcert, useUpdateConcert } from '@/hooks/queries/useAdminConcerts';
import { useCreateFestival, useUpdateFestival } from '@/hooks/queries/useAdminFestivals';
import { useUpdateStagedEvent } from '@/hooks/queries/useIngestion';
import { QuickCreateArtist } from '@/components/admin/QuickCreateArtist';
import { QuickCreateVenue } from '@/components/admin/QuickCreateVenue';
import { QuickCreatePromoter } from '@/components/admin/QuickCreatePromoter';
import { priceDataToHtml } from './priceHtml';
import { getMatchConfidence } from './matchClient';
import { smartTitleCase } from './titleCase';
import type { StagedEventWithSource } from '@/types/entities';

interface Entity { id: string; name: string }
interface VenueEntity extends Entity { city_name: string | null }
interface City { id: string; name: string }

interface Props {
  event: StagedEventWithSource | null;
  onClose: () => void;
}

export const ApproveStagedDialog = ({ event, onClose }: Props) => {
  const [artists, setArtists] = useState<Entity[]>([]);
  const [venues, setVenues] = useState<VenueEntity[]>([]);
  const [promoters, setPromoters] = useState<Entity[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [artistId, setArtistId] = useState<string>('');
  const [venueId, setVenueId] = useState<string>('');
  const [promoterId, setPromoterId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const createConcert = useCreateConcert();
  const updateConcert = useUpdateConcert();
  const createFestival = useCreateFestival();
  const updateFestival = useUpdateFestival();
  const updateStaged = useUpdateStagedEvent();

  const isFestival = event?.event_type_guess === 'festival';
  const alreadyPromoted = Boolean(event?.promoted_concert_id || event?.promoted_festival_id);
  const enrichTargetId = isFestival ? event?.matched_festival_id : event?.matched_concert_id;

  useEffect(() => {
    if (!event) return;
    let cancelled = false;
    (async () => {
      const [a, v, p, c] = await Promise.all([
        supabase.from('artists').select('id, name').order('name'),
        supabase.from('venues').select('id, name, cities:city_id (name)').order('name'),
        supabase.from('promoters').select('id, name').order('name'),
        supabase.from('cities').select('id, name').order('name'),
      ]);
      if (cancelled) return;
      setArtists((a.data ?? []) as Entity[]);
      setVenues(mapVenues(v.data));
      setPromoters((p.data ?? []) as Entity[]);
      setCities((c.data ?? []) as City[]);
    })();
    return () => { cancelled = true; };
  }, [event]);

  // Re-match on open against the freshly loaded catalog (server matches go stale between runs).
  useEffect(() => {
    if (!event) return;
    setArtistId(event.matched_artist_id ?? bestLocalMatch(event.artist_name, artists) ?? '');
    setVenueId(event.matched_venue_id ?? bestVenueMatch(event.venue_name, event.city_name, venues) ?? '');
    setPromoterId(event.matched_promoter_id ?? bestLocalMatch(event.promoter_name, promoters) ?? '');
  }, [event, artists, venues, promoters]);

  const priceHtml = useMemo(() => priceDataToHtml(event?.price_data ?? null), [event]);

  // Validación visible: ¿lo que dice la fuente ya existe en el catálogo?
  const artistMatch = useMemo(
    () => fieldMatch(event?.artist_name ?? null, artistId, artists),
    [event, artistId, artists],
  );
  const venueMatch = useMemo(() => {
    const base = fieldMatch(event?.venue_name ?? null, venueId, venues);
    // Con venues homónimos en varias ciudades, la ciudad es parte de la validación
    const selected = venues.find((v) => v.id === venueId);
    if (selected?.city_name && event?.city_name) {
      const cityOk = getMatchConfidence(event.city_name, selected.city_name) !== 'not_found';
      if (base.tone === 'ok' && !cityOk) {
        return {
          tone: 'review' as const,
          text: `El nombre coincide pero es el de ${selected.city_name} y la fuente dice ${event.city_name}: verifica`,
        };
      }
      if (base.tone === 'ok' && cityOk) {
        return { tone: 'ok' as const, text: `Ya está en el catálogo (${selected.city_name}) y coincide con la fuente` };
      }
    }
    return base;
  }, [event, venueId, venues]);
  const promoterMatch = useMemo(
    () => fieldMatch(event?.promoter_name ?? null, promoterId, promoters),
    [event, promoterId, promoters],
  );

  if (!event) return null;

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      if (isFestival) {
        let festivalId = enrichTargetId ?? null;
        if (festivalId) {
          await updateFestival.mutateAsync({
            id: festivalId,
            data: {
              venue_id: venueId || null,
              promoter_id: promoterId || null,
              image_url: event.image_url || undefined,
              ticket_url: event.ticket_url || undefined,
              ...(priceHtml ? { ticket_prices_html: priceHtml } : {}),
              ...(event.pulep_code ? { pulep_code: event.pulep_code } : {}),
            } as any,
          });
        } else {
          const created = await createFestival.mutateAsync({
            name: smartTitleCase(event.title),
            slug: `${slugify(event.title)}-${event.event_date ?? Date.now()}`,
            start_date: event.event_date,
            venue_id: venueId || null,
            promoter_id: promoterId || null,
            image_url: event.image_url || null,
            ticket_url: event.ticket_url || null,
            ticket_prices_html: priceHtml || null,
            pulep_code: event.pulep_code || null,
          } as any);
          festivalId = (created as any)?.id ?? null;
        }
        await finalize({ promoted_festival_id: festivalId });
      } else {
        let concertId = enrichTargetId ?? null;
        if (concertId) {
          await updateConcert.mutateAsync({
            id: concertId,
            data: {
              artist_id: artistId || null,
              venue_id: venueId || null,
              promoter_id: promoterId || null,
              image_url: event.image_url || undefined,
              ticket_url: event.ticket_url || undefined,
              ...(priceHtml ? { ticket_prices_html: priceHtml } : {}),
              ...(event.pulep_code ? { pulep_code: event.pulep_code } : {}),
            } as any,
          });
        } else {
          const created = await createConcert.mutateAsync({
            title: smartTitleCase(event.title),
            slug: `${slugify(event.title)}-${event.event_date ?? Date.now()}`,
            date: event.event_date,
            event_type: 'concert',
            artist_id: artistId || null,
            venue_id: venueId || null,
            promoter_id: promoterId || null,
            image_url: event.image_url || null,
            ticket_url: event.ticket_url || null,
            ticket_prices_html: priceHtml || null,
            pulep_code: event.pulep_code || null,
          } as any);
          concertId = (created as any)?.id ?? null;
        }
        await finalize({ promoted_concert_id: concertId });
      }
      onClose();
    } catch (error) {
      toast.error(`No se pudo promover: ${error instanceof Error ? error.message : 'error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const finalize = async (promoted: { promoted_concert_id?: string | null; promoted_festival_id?: string | null }) => {
    const { data: userData } = await supabase.auth.getUser();
    await updateStaged.mutateAsync({
      id: event.id,
      data: {
        status: 'approved',
        reviewed_by: userData.user?.id ?? null,
        reviewed_at: new Date().toISOString(),
        ...promoted,
      },
    });
  };

  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isFestival ? <Sparkles className="h-5 w-5 text-periwinkle" /> : <Calendar className="h-5 w-5 text-periwinkle" />}
            {smartTitleCase(event.title)}
          </DialogTitle>
        </DialogHeader>

        {alreadyPromoted ? (
          <div className="rounded-[16px] border border-verde/30 bg-verde/10 p-4 text-sm text-verde">
            Este evento ya fue promovido anteriormente. No se creará un duplicado.
          </div>
        ) : (
          <div className="space-y-4">
            {enrichTargetId && (
              <div className="rounded-[16px] border border-periwinkle/30 bg-periwinkle/10 p-3 text-xs text-periwinkle">
                Modo enriquecer: se actualizará el {isFestival ? 'festival' : 'concierto'} existente vinculado
                ({event.concert_match_type === 'pulep' ? 'match por PULEP' : 'match por artista + fecha'}), no se creará uno nuevo.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Fecha" value={`${event.event_date ?? '—'}${event.event_time ? ` · ${event.event_time}` : ''}`} />
              <Field label="Ciudad" value={event.city_name ?? '—'} />
              <Field label="Tipo" value={isFestival ? 'Festival' : 'Concierto'} />
              <Field label="PULEP" value={event.pulep_code ?? '—'} />
            </div>

            {event.extraction_notes && (
              <div className="rounded-[16px] border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
                {event.extraction_notes}
              </div>
            )}

            {!isFestival && (
              <div>
                <Label className="text-xs text-texto-2">Artista</Label>
                <div className="mt-1 flex gap-2">
                  <Select value={artistId} onValueChange={setArtistId}>
                    <SelectTrigger className={matchBorder(artistMatch.tone)}>
                      <SelectValue placeholder="Selecciona artista" />
                    </SelectTrigger>
                    <SelectContent>
                      {artists.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <QuickCreateArtist
                    initialName={event.artist_name ?? undefined}
                    onArtistCreated={(id) => { void refetchArtists(setArtists); setArtistId(id); }}
                  />
                </div>
                <MatchHint match={artistMatch} />
              </div>
            )}

            <div>
              <Label className="text-xs text-texto-2">Venue</Label>
              <div className="mt-1 flex gap-2">
                <Select value={venueId} onValueChange={setVenueId}>
                  <SelectTrigger className={matchBorder(venueMatch.tone)}>
                    <SelectValue placeholder="Selecciona venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                        {v.city_name && <span className="text-texto-2"> · {v.city_name}</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <QuickCreateVenue
                  cities={cities}
                  initialName={event.venue_name ?? undefined}
                  initialCityName={event.city_name ?? undefined}
                  onVenueCreated={(id) => { void refetchVenues(setVenues); setVenueId(id); }}
                />
              </div>
              <MatchHint match={venueMatch} />
            </div>

            <div>
              <Label className="text-xs text-texto-2">Promotora</Label>
              <div className="mt-1 flex gap-2">
                <Select value={promoterId} onValueChange={setPromoterId}>
                  <SelectTrigger className={matchBorder(promoterMatch.tone)}>
                    <SelectValue placeholder="Selecciona promotora" />
                  </SelectTrigger>
                  <SelectContent>
                    {promoters.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <QuickCreatePromoter onPromoterCreated={(id) => { void refetchPromoters(setPromoters); setPromoterId(id); }} />
              </div>
              <MatchHint match={promoterMatch} />
            </div>

            {event.price_data?.type === 'image' && event.price_data.image_url && (
              <div className="rounded-[16px] border border-linea bg-superficie-2/50 p-3 text-xs text-texto-2">
                Precios en imagen. <a className="text-periwinkle hover:underline" href={event.price_data.image_url} target="_blank" rel="noopener noreferrer">Ver imagen de precios</a>. Puedes extraerlos con la herramienta de precios en la ficha del concierto tras aprobar.
              </div>
            )}

            <a href={event.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-periwinkle hover:underline">
              <ExternalLink className="h-3 w-3" /> Ver en la fuente ({event.source_name})
            </a>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" className="rounded-full border-linea bg-transparent" onClick={onClose}>
            Cerrar
          </Button>
          {!alreadyPromoted && (
            <Button
              className="rounded-full border-0 bg-[linear-gradient(95deg,#004AAD,#597CFF)] text-white font-semibold shadow-[0_8px_32px_rgba(0,74,173,.4)]"
              disabled={submitting}
              onClick={handleApprove}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {enrichTargetId ? 'Enriquecer existente' : `Crear ${isFestival ? 'festival' : 'concierto'}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-wide text-texto-2/70">{label}</Label>
      <p className="text-texto">{value}</p>
    </div>
  );
}

type MatchTone = 'ok' | 'review' | 'missing' | 'none';

interface FieldMatchState {
  tone: MatchTone;
  text: string;
}

/**
 * Valida lo seleccionado contra lo que dice la fuente:
 * ok = ya existe y coincide · review = existe pero hay que verificar ·
 * missing = la fuente trae un nombre que no está en el catálogo · none = sin dato
 */
function fieldMatch(scraped: string | null, selectedId: string, list: Entity[]): FieldMatchState {
  const selected = list.find((entity) => entity.id === selectedId);

  if (selected) {
    if (!scraped) return { tone: 'ok', text: `Seleccionado del catálogo: ${selected.name}` };
    const confidence = getMatchConfidence(scraped, selected.name);
    if (confidence === 'exact') {
      return { tone: 'ok', text: 'Ya está en el catálogo y coincide con la fuente' };
    }
    if (confidence === 'partial') {
      return { tone: 'review', text: `Coincidencia parcial con "${scraped}": verifica que sea el mismo` };
    }
    return { tone: 'review', text: `Distinto a lo que dice la fuente ("${scraped}"): verifica` };
  }

  if (scraped) {
    return { tone: 'missing', text: `"${scraped}" no está en el catálogo: créalo con Nuevo` };
  }
  return { tone: 'none', text: 'La fuente no trae este dato (opcional)' };
}

function matchBorder(tone: MatchTone): string {
  if (tone === 'ok') return 'border-verde/40';
  if (tone === 'review' || tone === 'missing') return 'border-amber-500/40';
  return '';
}

function MatchHint({ match }: { match: FieldMatchState }) {
  const styles: Record<MatchTone, { icon: typeof CheckCircle2; className: string }> = {
    ok: { icon: CheckCircle2, className: 'text-verde' },
    review: { icon: AlertTriangle, className: 'text-amber-400' },
    missing: { icon: AlertTriangle, className: 'text-amber-400' },
    none: { icon: Info, className: 'text-texto-2/70' },
  };
  const { icon: Icon, className } = styles[match.tone];
  return (
    <p className={`mt-1.5 flex items-center gap-1.5 text-[11px] ${className}`}>
      <Icon className="h-3 w-3 shrink-0" />
      {match.text}
    </p>
  );
}

function bestLocalMatch(name: string | null, candidates: Entity[]): string | null {
  if (!name) return null;
  let partial: string | null = null;
  for (const c of candidates) {
    const conf = getMatchConfidence(name, c.name);
    if (conf === 'exact') return c.id;
    if (conf === 'partial' && !partial) partial = c.id;
  }
  return partial;
}

/**
 * Match de venue consciente de ciudad: entre venues homónimos
 * ("Movistar Arena" en Bogotá, Buenos Aires y Santiago) prefiere
 * el de la ciudad que reporta la fuente.
 */
function bestVenueMatch(
  name: string | null,
  cityName: string | null,
  candidates: VenueEntity[],
): string | null {
  if (!name) return null;
  const matches = candidates.filter((c) => getMatchConfidence(name, c.name) !== 'not_found');
  if (!matches.length) return null;

  if (cityName) {
    const inCity = matches.filter(
      (c) => c.city_name && getMatchConfidence(cityName, c.city_name) !== 'not_found',
    );
    if (inCity.length) {
      const exactInCity = inCity.find((c) => getMatchConfidence(name, c.name) === 'exact');
      return (exactInCity ?? inCity[0]).id;
    }
  }

  const exact = matches.find((c) => getMatchConfidence(name, c.name) === 'exact');
  return (exact ?? matches[0]).id;
}

function mapVenues(rows: unknown): VenueEntity[] {
  return ((rows ?? []) as any[]).map((v) => ({
    id: v.id,
    name: v.name,
    city_name: v.cities?.name ?? null,
  }));
}

async function refetchArtists(set: (v: Entity[]) => void) {
  const { data } = await supabase.from('artists').select('id, name').order('name');
  set((data ?? []) as Entity[]);
}
async function refetchVenues(set: (v: VenueEntity[]) => void) {
  const { data } = await supabase.from('venues').select('id, name, cities:city_id (name)').order('name');
  set(mapVenues(data));
}
async function refetchPromoters(set: (v: Entity[]) => void) {
  const { data } = await supabase.from('promoters').select('id, name').order('name');
  set((data ?? []) as Entity[]);
}
