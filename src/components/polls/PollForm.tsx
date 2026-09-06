import { useState } from 'react';
import { ChevronUp, X, Music, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ArtistSearch, type ArtistPick } from './ArtistSearch';
import { useSubmitPoll } from '@/hooks/queries/usePolls';
import type { PollWithRelations, PollChoice, PollDemographics } from '@/types/entities/poll';
import {
  AGE_RANGES,
  EDITIONS_ATTENDED,
  FAVORITE_GENRES,
  HEARD_FROM,
  getPollDeviceToken,
  markPollAnswered,
  type PollOption,
} from '@/lib/polls';

const SUGGESTED_CITIES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira',
  'Manizales', 'Cúcuta', 'Ibagué', 'Villavicencio', 'Santa Marta', 'Tunja', 'Armenia',
  'Ciudad de México', 'Lima', 'Quito', 'Buenos Aires', 'Santiago', 'Caracas', 'Panamá', 'Madrid',
];

interface PollFormProps {
  poll: PollWithRelations;
  source: string;
  /** Modo stand: la misma tablet la usan muchas personas, cada envío usa un token nuevo. */
  kiosk?: boolean;
  onSubmitted: (choices: PollChoice[]) => void;
}

const Chip = ({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={cn(
      'rounded-full px-4 py-2 text-sm font-medium border transition-colors',
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-fucsia focus-visible:outline-offset-2',
      selected
        ? 'border-fucsia bg-fucsia/15 text-texto'
        : 'border-linea bg-transparent text-texto-2 hover:text-texto hover:bg-superficie-2',
    )}
  >
    {children}
  </button>
);

const ChipGroup = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: PollOption[];
  value: string | null | undefined;
  onChange: (v: string | null) => void;
}) => (
  <fieldset className="space-y-2">
    <legend className="text-sm font-semibold text-texto">{label}</legend>
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o.value} selected={value === o.value} onClick={() => onChange(value === o.value ? null : o.value)}>
          {o.label}
        </Chip>
      ))}
    </div>
  </fieldset>
);

export const PollForm = ({ poll, source, kiosk = false, onSubmitted }: PollFormProps) => {
  const [choices, setChoices] = useState<PollChoice[]>([]);
  const [step, setStep] = useState<'artists' | 'about'>('artists');
  const [demographics, setDemographics] = useState<PollDemographics>({});
  const submit = useSubmitPoll();

  const max = poll.max_choices;
  const dayOptions: PollOption[] = (poll.day_options ?? []).map((d) => ({ value: d, label: d }));

  const addChoice = (pick: ArtistPick) => {
    if (choices.length >= max) return;
    const duplicate = choices.some(
      (c) => (pick.spotify_id && c.spotify_id === pick.spotify_id) || c.name.toLowerCase() === pick.name.toLowerCase(),
    );
    if (duplicate) {
      toast.info('Ese artista ya está en tu lista');
      return;
    }
    setChoices((prev) => [...prev, { ...pick, position: prev.length + 1 }]);
  };

  const removeChoice = (index: number) => {
    setChoices((prev) => prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, position: i + 1 })));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setChoices((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((c, i) => ({ ...c, position: i + 1 }));
    });
  };

  const setDemo = (field: keyof PollDemographics) => (value: string | null) =>
    setDemographics((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (withDemographics: boolean) => {
    if (choices.length === 0) return;
    const deviceToken = kiosk ? crypto.randomUUID() : getPollDeviceToken();
    try {
      await submit.mutateAsync({
        poll_slug: poll.slug,
        device_token: deviceToken,
        artists: choices.map((c) => ({ spotify_id: c.spotify_id, name: c.name, position: c.position })),
        demographics: withDemographics ? demographics : undefined,
        source,
      });
      if (!kiosk) markPollAnswered(poll.slug);
      onSubmitted(choices);
    } catch (error) {
      const err = error as Error & { status?: number };
      if (err.status === 409 && !kiosk) {
        markPollAnswered(poll.slug);
        onSubmitted(choices);
        return;
      }
      toast.error(err.message || 'Algo se desconectó. Inténtalo de nuevo.');
    }
  };

  const continueLabel = poll.ask_demographics ? 'Continuar' : `Enviar mi top ${max}`;

  if (step === 'about') {
    return (
      <div className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-fucsia mb-1">Paso 2 de 2</p>
          <h2 className="font-display font-black uppercase text-3xl leading-none tracking-[0.01em] text-texto">
            Cuéntanos un poco de ti
          </h2>
          <p className="text-sm text-texto-2 mt-2">
            Todo es opcional y anónimo. Nos ayuda a entender quién vive el festival.
          </p>
        </div>

        <ChipGroup label="¿Cuántos años tienes?" options={AGE_RANGES} value={demographics.age_range} onChange={setDemo('age_range')} />

        <div className="space-y-2">
          <label htmlFor="origin-city" className="text-sm font-semibold text-texto block">
            ¿De qué ciudad vienes?
          </label>
          <Input
            id="origin-city"
            list="poll-city-suggestions"
            value={demographics.origin_city ?? ''}
            onChange={(e) => setDemo('origin_city')(e.target.value || null)}
            placeholder="Ciudad o país, si vienes de afuera"
            maxLength={80}
            autoComplete="off"
            className="h-12 rounded-full bg-superficie border-linea text-texto placeholder:text-texto-2 focus-visible:ring-fucsia"
          />
          <datalist id="poll-city-suggestions">
            {SUGGESTED_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <ChipGroup label="¿A cuántas ediciones has venido?" options={EDITIONS_ATTENDED} value={demographics.editions_attended} onChange={setDemo('editions_attended')} />

        {dayOptions.length > 0 && (
          <ChipGroup label="¿Qué día viniste?" options={dayOptions} value={demographics.attended_day} onChange={setDemo('attended_day')} />
        )}

        <ChipGroup label="¿Tu género favorito?" options={FAVORITE_GENRES} value={demographics.favorite_genre} onChange={setDemo('favorite_genre')} />

        <ChipGroup label="¿Cómo te enteraste del festival?" options={HEARD_FROM} value={demographics.heard_from} onChange={setDemo('heard_from')} />

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={submit.isPending}
            className="h-12 rounded-full px-8 text-base font-semibold text-white bg-gradient-to-r from-morado to-fucsia hover:-translate-y-0.5 transition-transform shadow-[0_8px_32px_rgba(117,22,226,.45)]"
          >
            {submit.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : `Enviar mi top ${max}`}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleSubmit(false)}
            disabled={submit.isPending}
            className="h-12 rounded-full text-texto-2 hover:text-texto hover:bg-superficie-2"
          >
            Omitir y enviar
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep('artists')}
            disabled={submit.isPending}
            className="h-12 rounded-full text-texto-2 hover:text-texto hover:bg-superficie-2 sm:ml-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        {poll.ask_demographics && (
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-fucsia mb-1">Paso 1 de 2</p>
        )}
        <h2 className="font-display font-black uppercase text-3xl leading-none tracking-[0.01em] text-texto">
          {poll.question}
        </h2>
        <p className="text-sm text-texto-2 mt-2">
          Busca y elige hasta {max}. El orden importa: el primero es tu favorito.
        </p>
      </div>

      <ol className="space-y-2" aria-label="Tu selección">
        {Array.from({ length: max }, (_, i) => {
          const choice = choices[i];
          return (
            <li
              key={i}
              className={cn(
                'flex items-center gap-3 rounded-[20px] border px-4 py-3 min-h-[68px]',
                choice ? 'border-linea bg-superficie' : 'border-dashed border-linea/80 bg-transparent',
              )}
            >
              <span
                className={cn(
                  'font-display font-black text-3xl leading-none w-8 text-center shrink-0',
                  choice ? 'text-naranja' : 'text-texto-2/50',
                )}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              {choice ? (
                <>
                  {choice.image_url ? (
                    <img src={choice.image_url} alt="" className="h-11 w-11 rounded-full object-cover shrink-0" />
                  ) : (
                    <span className="h-11 w-11 rounded-full bg-superficie-2 flex items-center justify-center shrink-0">
                      <Music className="h-5 w-5 text-texto-2" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 font-medium text-texto truncate">{choice.name}</span>
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => moveUp(i)}
                      aria-label={`Subir a ${choice.name} a la posición ${i}`}
                      className="h-9 w-9 rounded-full flex items-center justify-center text-texto-2 hover:text-texto hover:bg-superficie-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-fucsia"
                    >
                      <ChevronUp className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeChoice(i)}
                    aria-label={`Quitar a ${choice.name}`}
                    className="h-9 w-9 rounded-full flex items-center justify-center text-texto-2 hover:text-fucsia hover:bg-superficie-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-fucsia"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <span className="text-sm text-texto-2">
                  {i === 0 ? 'Tu artista favorito' : `Tu artista número ${i + 1}`}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {choices.length < max ? (
        <ArtistSearch
          excludeSpotifyIds={choices.map((c) => c.spotify_id).filter(Boolean) as string[]}
          onSelect={addChoice}
          placeholder={choices.length === 0 ? 'Busca tu artista favorito' : 'Busca otro artista'}
        />
      ) : (
        <p className="text-sm text-texto-2 text-center">
          Ya tienes tu top {max}. Puedes reordenar o quitar alguno antes de continuar.
        </p>
      )}

      <Button
        type="button"
        onClick={() => (poll.ask_demographics ? setStep('about') : handleSubmit(false))}
        disabled={choices.length === 0 || submit.isPending}
        className="w-full h-12 rounded-full text-base font-semibold text-white bg-gradient-to-r from-morado to-fucsia hover:-translate-y-0.5 transition-transform shadow-[0_8px_32px_rgba(117,22,226,.45)] disabled:opacity-50 disabled:shadow-none"
      >
        {submit.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : continueLabel}
      </Button>
    </div>
  );
};
