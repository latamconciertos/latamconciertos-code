import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAdminFestivals } from '@/hooks/queries/useAdminFestivals';
import { useCreatePoll, useUpdatePoll } from '@/hooks/queries/usePolls';
import { slugify } from '@/lib/slugify';
import type { PollWithRelations, PollInsert } from '@/types/entities/poll';

const NO_FESTIVAL = '__none__';

const pollFormSchema = z.object({
  title: z.string().trim().min(3, 'Mínimo 3 caracteres').max(120),
  slug: z.string().trim().min(3, 'Mínimo 3 caracteres').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  description: z.string().trim().max(500).optional(),
  question: z.string().trim().min(5, 'Escribe la pregunta').max(200),
  festival_id: z.string(),
  max_choices: z.coerce.number().int().min(1).max(5),
  day_options: z.string().trim(),
  ask_demographics: z.boolean(),
  is_active: z.boolean(),
  starts_at: z.string(),
  ends_at: z.string(),
});

type PollFormValues = z.infer<typeof pollFormSchema>;

interface PollFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll?: PollWithRelations | null;
}

// datetime-local trabaja en hora local del navegador; guardamos ISO en UTC.
const toLocalInput = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalInput = (value: string): string | null => (value ? new Date(value).toISOString() : null);

const defaultsFrom = (poll?: PollWithRelations | null): PollFormValues => ({
  title: poll?.title ?? '',
  slug: poll?.slug ?? '',
  description: poll?.description ?? '',
  question: poll?.question ?? '¿Qué artistas te gustaría ver en la próxima edición?',
  festival_id: poll?.festival_id ?? NO_FESTIVAL,
  max_choices: poll?.max_choices ?? 3,
  day_options: (poll?.day_options ?? ['Sábado', 'Domingo', 'Ambos días']).join(', '),
  ask_demographics: poll?.ask_demographics ?? true,
  is_active: poll?.is_active ?? false,
  starts_at: toLocalInput(poll?.starts_at),
  ends_at: toLocalInput(poll?.ends_at),
});

export const PollFormDialog = ({ open, onOpenChange, poll }: PollFormDialogProps) => {
  const isEdit = !!poll;
  const { data: festivalsData } = useAdminFestivals();
  const festivals = festivalsData ?? [];
  const createPoll = useCreatePoll();
  const updatePoll = useUpdatePoll();

  const form = useForm<PollFormValues>({
    resolver: zodResolver(pollFormSchema),
    defaultValues: defaultsFrom(poll),
  });

  useEffect(() => {
    if (open) form.reset(defaultsFrom(poll));
  }, [open, poll, form]);

  const slugTouched = form.formState.dirtyFields.slug;

  const handleTitleChange = (value: string) => {
    form.setValue('title', value);
    if (!isEdit && !slugTouched) form.setValue('slug', slugify(value));
  };

  const onSubmit = async (values: PollFormValues) => {
    const payload: PollInsert = {
      title: values.title,
      slug: values.slug,
      description: values.description || null,
      question: values.question,
      festival_id: values.festival_id === NO_FESTIVAL ? null : values.festival_id,
      max_choices: values.max_choices,
      day_options: values.day_options.split(',').map((d) => d.trim()).filter(Boolean),
      ask_demographics: values.ask_demographics,
      is_active: values.is_active,
      starts_at: fromLocalInput(values.starts_at),
      ends_at: fromLocalInput(values.ends_at),
    };

    if (isEdit && poll) {
      await updatePoll.mutateAsync({ id: poll.id, input: payload });
    } else {
      await createPoll.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const pending = createPoll.isPending || updatePoll.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-superficie border-linea">
        <DialogHeader>
          <DialogTitle className="font-display font-black uppercase text-2xl">
            {isEdit ? 'Editar encuesta' : 'Nueva encuesta'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Festival Cordillera 2027" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="festival-cordillera-2027" />
                  </FormControl>
                  <FormDescription>URL pública: /encuestas/{field.value || 'slug'}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pregunta</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} placeholder="Texto corto que aparece bajo el título" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="festival_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Festival</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin festival" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_FESTIVAL}>Sin festival</SelectItem>
                        {festivals.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_choices"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artistas por persona</FormLabel>
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            Top {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="day_options"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Días del festival</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Sábado, Domingo, Ambos días" />
                  </FormControl>
                  <FormDescription>Separados por coma. Se usan en la pregunta "¿Qué día viniste?". Déjalo vacío para no preguntar.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="starts_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abre (opcional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ends_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cierra (opcional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ask_demographics"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-[20px] border border-linea px-4 py-3">
                  <div>
                    <FormLabel>Preguntar perfil de audiencia</FormLabel>
                    <FormDescription>Edad, ciudad de origen, ediciones, día, género y cómo se enteró.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-[20px] border border-linea px-4 py-3">
                  <div>
                    <FormLabel>Encuesta activa</FormLabel>
                    <FormDescription>Al activarla aparece "Encuestas" en el menú Experiencias.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending} className="rounded-full bg-gradient-to-r from-morado to-fucsia text-white">
                {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? 'Guardar cambios' : 'Crear encuesta'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
