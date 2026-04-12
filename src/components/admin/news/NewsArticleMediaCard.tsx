import { useFormContext } from 'react-hook-form';
import { ChevronDown, ImageIcon } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';
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
import { Input } from '@/components/ui/input';
import type { NewsArticleFormValues } from './newsFormSchema';

export const NewsArticleMediaCard = () => {
  const form = useFormContext<NewsArticleFormValues>();
  const hasImage = Boolean(form.watch('featured_image'));

  return (
    <Collapsible defaultOpen={hasImage}>
      <div className="rounded-lg border bg-card overflow-hidden">
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-base font-semibold">Imágenes destacadas</span>
            {hasImage && (
              <span className="text-xs text-green-600 font-medium">Subida</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 space-y-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="featured_image"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUpload
                        label="Imagen Desktop (16:9)"
                        currentImageUrl={field.value}
                        onImageUploaded={(url) => field.onChange(url)}
                        enableCrop
                        aspectRatio={16 / 9}
                        cropTitle="Encuadre Desktop (16:9)"
                        cropDescription="Selecciona el área para pantallas grandes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featured_image_mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUpload
                        label="Imagen Mobile (4:5)"
                        currentImageUrl={field.value}
                        onImageUploaded={(url) => field.onChange(url)}
                        enableCrop
                        aspectRatio={4 / 5}
                        cropTitle="Encuadre Mobile (4:5)"
                        cropDescription="Selecciona el área para teléfono"
                      />
                    </FormControl>
                    <FormDescription>
                      Opcional — usa la desktop si no se sube
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="photo_credit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crédito de foto</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Getty Images, nombre del fotógrafo..."
                      {...field}
                    />
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
