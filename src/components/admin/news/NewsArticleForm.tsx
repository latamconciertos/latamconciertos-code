import { useMemo, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Send,
  Loader2,
  ChevronDown,
  Film,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { TicketPriceExtractor } from '@/components/admin/TicketPriceExtractor';
import { NewsMediaManager } from '@/components/admin/NewsMediaManager';
import {
  useCreateNewsArticle,
  useUpdateNewsArticle,
} from '@/hooks/queries/useAdminNews';
import { useNewsFormEntities } from '@/hooks/queries/useNewsFormEntities';
import { useNewsArticleQuality, QUALITY_THRESHOLDS } from '@/hooks/admin/useNewsArticleQuality';
import { supabase } from '@/integrations/supabase/client';
import type { NewsArticle } from '@/types/entities';

import {
  newsArticleFormSchema,
  newsFormDefaults,
  articleToFormValues,
  formValuesToDbPayload,
  mediaListFromArticle,
  NONE_VALUE,
  type NewsArticleFormValues,
  type MediaFormItem,
} from './newsFormSchema';
import { NewsArticleMediaCard } from './NewsArticleMediaCard';
import { NewsArticlePublicationCard } from './NewsArticlePublicationCard';
import { NewsArticleRelationsCard } from './NewsArticleRelationsCard';
import { NewsArticleSEOCard } from './NewsArticleSEOCard';
import { NewsArticleQualityPanel } from './NewsArticleQualityPanel';

interface NewsArticleFormProps {
  article?: NewsArticle | null;
}

export const NewsArticleForm = ({ article }: NewsArticleFormProps) => {
  const navigate = useNavigate();
  const createArticle = useCreateNewsArticle();
  const updateArticle = useUpdateNewsArticle();
  const { categories, artists, authors, concerts } = useNewsFormEntities();

  const isEditing = Boolean(article);

  const form = useForm<NewsArticleFormValues>({
    resolver: zodResolver(newsArticleFormSchema),
    defaultValues: article ? articleToFormValues(article) : newsFormDefaults,
  });

  const watchedValues = form.watch();
  const quality = useNewsArticleQuality(watchedValues);

  const [mediaItems, setMediaItems] = useState<MediaFormItem[]>(
    article?.news_media ? mediaListFromArticle(article.news_media) : [],
  );

  const selectedConcertTicketUrl = useMemo(() => {
    const concertId = watchedValues.concert_id;
    if (!concertId || concertId === NONE_VALUE) return '';
    return concerts.find((c) => c.id === concertId)?.ticket_url ?? '';
  }, [watchedValues.concert_id, concerts]);

  const handleInsertPriceContent = (html: string) => {
    const current = form.getValues('content') ?? '';
    form.setValue('content', current + '\n\n' + html, { shouldDirty: true });
  };

  const isSaving = createArticle.isPending || updateArticle.isPending;

  const saveMedia = async (articleId: string) => {
    await supabase.from('news_media').delete().eq('article_id', articleId);
    if (mediaItems.length > 0) {
      const mediaData = mediaItems.map((item, index) => ({
        article_id: articleId,
        media_type: item.media_type,
        media_url: item.media_url,
        caption: item.caption || null,
        position: index,
      }));
      await supabase.from('news_media').insert(mediaData);
    }
  };

  const onSubmit = async (values: NewsArticleFormValues) => {
    if (values.status === 'published' && !quality.isValid) {
      toast.error(
        'Revisa los requisitos de calidad antes de publicar.',
      );
      return;
    }

    try {
      const payload = formValuesToDbPayload(values, {
        isCreate: !isEditing,
        existingPublishedAt: article?.published_at,
      });

      if (isEditing && article) {
        await updateArticle.mutateAsync({ id: article.id, data: payload as any });
        await saveMedia(article.id);
      } else {
        const result = await createArticle.mutateAsync(payload as any);
        if (result) await saveMedia(result.id);
      }

      navigate('/admin?tab=news');
    } catch {
      // Handled by mutation hooks
    }
  };

  const handleSaveDraft = async () => {
    form.setValue('status', 'draft');
    const values = form.getValues();
    const valid = await form.trigger('title');
    if (!valid) return;
    await onSubmit({ ...values, status: 'draft' });
  };

  const handlePublish = () => {
    form.setValue('status', 'published');
    form.handleSubmit(onSubmit)();
  };

  return (
    <FormProvider {...form}>
      {/* ── Sticky header ──────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin?tab=news')}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold truncate">
                {isEditing ? 'Editar artículo' : 'Nuevo artículo'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={handleSaveDraft}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              <span className="hidden sm:inline">Guardar borrador</span>
              <span className="sm:hidden">Borrador</span>
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSaving || !quality.isValid}
              onClick={handlePublish}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1.5" />
              )}
              Publicar
            </Button>
          </div>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── Main column ─────────────────────────────────────── */}
          <div className="lg:col-span-8 space-y-6">
            {/* Title — clean headline-style input */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Escribe el título del artículo..."
                      className="!text-2xl sm:!text-3xl font-bold border-0 border-b rounded-none px-0 py-3 shadow-none focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground/40 h-auto"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content editor */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RichTextEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Escribe el contenido del artículo aquí..."
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span
                      className={
                        quality.wordCount >= QUALITY_THRESHOLDS.minWords
                          ? 'text-green-600 font-medium'
                          : 'text-muted-foreground'
                      }
                    >
                      {quality.wordCount} palabras
                    </span>
                    {quality.wordCount < QUALITY_THRESHOLDS.minWords && (
                      <span> — mínimo {QUALITY_THRESHOLDS.minWords} para publicar</span>
                    )}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Featured images (collapsible) */}
            <NewsArticleMediaCard />

            {/* Ticket price extractor (collapsible, only if concert selected) */}
            {selectedConcertTicketUrl && (
              <Collapsible>
                <div className="rounded-lg border bg-card overflow-hidden">
                  <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-muted-foreground" />
                      <span className="text-base font-semibold">
                        Extractor de precios
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-1 border-t">
                      <TicketPriceExtractor
                        ticketUrl={selectedConcertTicketUrl}
                        onInsertContent={handleInsertPriceContent}
                      />
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )}

            {/* Media gallery (collapsible) */}
            <Collapsible defaultOpen={mediaItems.length > 0}>
              <div className="rounded-lg border bg-card overflow-hidden">
                <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-muted-foreground" />
                    <span className="text-base font-semibold">
                      Galería multimedia
                    </span>
                    {mediaItems.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {mediaItems.length} archivo{mediaItems.length !== 1 && 's'}
                      </span>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-1 border-t">
                    <NewsMediaManager
                      articleId={article?.id}
                      initialMedia={mediaItems}
                      onChange={setMediaItems}
                    />
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>

          {/* ── Sidebar ─────────────────────────────────────────── */}
          <div className="lg:col-span-4 space-y-4">
            <div className="sticky top-[73px] space-y-4">
              {/* Quality — always visible, expandable */}
              <NewsArticleQualityPanel
                report={quality}
                status={watchedValues.status}
              />

              {/* Publication — always visible, essential */}
              <NewsArticlePublicationCard
                categories={categories}
                authors={authors}
              />

              {/* Relations — collapsible, optional */}
              <NewsArticleRelationsCard
                artists={artists}
                concerts={concerts}
              />

              {/* SEO — collapsible, secondary */}
              <NewsArticleSEOCard metaDescLength={quality.metaDescLength} />
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
};
