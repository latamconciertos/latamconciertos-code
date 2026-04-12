import { useFormContext } from 'react-hook-form';
import { ChevronDown, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { QUALITY_THRESHOLDS } from '@/hooks/admin/useNewsArticleQuality';
import type { NewsArticleFormValues } from './newsFormSchema';

interface NewsArticleSEOCardProps {
  metaDescLength: number;
}

export const NewsArticleSEOCard = ({ metaDescLength }: NewsArticleSEOCardProps) => {
  const form = useFormContext<NewsArticleFormValues>();
  const isMetaDescOk =
    metaDescLength >= QUALITY_THRESHOLDS.metaDescriptionMin &&
    metaDescLength <= QUALITY_THRESHOLDS.metaDescriptionMax;

  const hasContent = Boolean(
    form.getValues('slug') ||
      form.getValues('meta_title') ||
      form.getValues('meta_description') ||
      form.getValues('keywords'),
  );

  return (
    <Collapsible defaultOpen={hasContent}>
      <div className="rounded-lg border bg-card overflow-hidden">
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              SEO
            </span>
            {isMetaDescOk && (
              <span className="text-xs text-green-600 font-medium">OK</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-1 space-y-4 border-t">
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="se-genera-del-titulo"
                      className="text-xs font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Automático si lo dejas vacío
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="meta_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título para motores de búsqueda" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="meta_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Descripción para Google (120-160 caracteres)"
                      maxLength={200}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    <span
                      className={
                        isMetaDescOk
                          ? 'text-green-600 font-medium'
                          : 'text-yellow-600 font-medium'
                      }
                    >
                      {metaDescLength}
                    </span>
                    /{QUALITY_THRESHOLDS.metaDescriptionMin}-
                    {QUALITY_THRESHOLDS.metaDescriptionMax} caracteres
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Palabras clave</FormLabel>
                  <FormControl>
                    <Input placeholder="rock, colombia, concierto" {...field} />
                  </FormControl>
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
