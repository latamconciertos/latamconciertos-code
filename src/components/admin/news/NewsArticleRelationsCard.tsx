import { useFormContext } from 'react-hook-form';
import { ChevronDown, Link2 } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { NewsFormArtist, NewsFormConcert } from '@/hooks/queries/useNewsFormEntities';
import { NONE_VALUE, type NewsArticleFormValues } from './newsFormSchema';

interface NewsArticleRelationsCardProps {
  artists: NewsFormArtist[];
  concerts: NewsFormConcert[];
}

const formatConcertDate = (date: string | null): string =>
  date ? date.split('-').reverse().join('/') : 'Sin fecha';

export const NewsArticleRelationsCard = ({
  artists,
  concerts,
}: NewsArticleRelationsCardProps) => {
  const form = useFormContext<NewsArticleFormValues>();
  const artistId = form.watch('artist_id');
  const concertId = form.watch('concert_id');

  const hasRelations =
    (artistId && artistId !== NONE_VALUE) || (concertId && concertId !== NONE_VALUE);

  return (
    <Collapsible defaultOpen={hasRelations}>
      <div className="rounded-lg border bg-card overflow-hidden">
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Relaciones
            </span>
            {!hasRelations && (
              <span className="text-xs text-muted-foreground/60">Opcional</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-1 space-y-4 border-t">
            <FormField
              control={form.control}
              name="artist_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artista relacionado</FormLabel>
                  <Select
                    value={field.value || NONE_VALUE}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Ninguno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Ninguno</SelectItem>
                      {artists.map((artist) => (
                        <SelectItem key={artist.id} value={artist.id}>
                          {artist.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Vincula el artículo a un artista de la plataforma
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="concert_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concierto relacionado</FormLabel>
                  <Select
                    value={field.value || NONE_VALUE}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Ninguno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Ninguno</SelectItem>
                      {concerts.map((concert) => (
                        <SelectItem key={concert.id} value={concert.id}>
                          {concert.title} — {formatConcertDate(concert.date)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
