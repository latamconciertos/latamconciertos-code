import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
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
import {
  Calendar,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  User,
  Trash2,
} from 'lucide-react';
import {
  useUpdateAccreditation,
  useDeleteAccreditation,
} from '@/hooks/queries/useAccreditations';
import {
  ACCREDITATION_STATUS_LABELS,
  type AccreditationStatus,
  type AccreditationWithTeam,
} from '@/types/entities';
import { toast } from 'sonner';
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

const STATUSES: AccreditationStatus[] = [
  'draft',
  'pending',
  'submitted',
  'approved',
  'rejected',
  'expired',
];

interface Props {
  accreditation: AccreditationWithTeam | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccreditationDetailSheet({ accreditation, open, onOpenChange }: Props) {
  const updateAccreditation = useUpdateAccreditation();
  const deleteAccreditation = useDeleteAccreditation();

  const [form, setForm] = useState({
    event_name: '',
    venue_name: '',
    event_date: '',
    deadline: '',
    status: 'draft' as AccreditationStatus,
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    proposal_url: '',
    notes: '',
    response_notes: '',
  });

  useEffect(() => {
    if (!accreditation) return;
    setForm({
      event_name: accreditation.event_name ?? '',
      venue_name: accreditation.venue_name ?? '',
      event_date: accreditation.event_date ?? '',
      deadline: accreditation.deadline ?? '',
      status: accreditation.status,
      contact_name: accreditation.contact_name ?? '',
      contact_email: accreditation.contact_email ?? '',
      contact_phone: accreditation.contact_phone ?? '',
      proposal_url: accreditation.proposal_url ?? '',
      notes: accreditation.notes ?? '',
      response_notes: accreditation.response_notes ?? '',
    });
  }, [accreditation]);

  if (!accreditation) return null;

  const handleSave = () => {
    updateAccreditation.mutate(
      {
        id: accreditation.id,
        data: {
          event_name: form.event_name,
          venue_name: form.venue_name || null,
          event_date: form.event_date || null,
          deadline: form.deadline,
          status: form.status,
          contact_name: form.contact_name || null,
          contact_email: form.contact_email || null,
          contact_phone: form.contact_phone || null,
          proposal_url: form.proposal_url || null,
          notes: form.notes || null,
          response_notes: form.response_notes || null,
        },
      },
      {
        onSuccess: () => {
          toast.success('Cambios guardados');
          onOpenChange(false);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteAccreditation.mutate(accreditation.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const teamCount = accreditation.event_team_assignments?.length ?? 0;
  const confirmedCount =
    accreditation.event_team_assignments?.filter((t) => t.confirmed).length ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
        {/* Header */}
        <SheetHeader className="sticky top-0 bg-background border-b border-border px-6 py-5 z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
            Acreditación
          </p>
          <SheetTitle className="font-display uppercase text-2xl md:text-3xl font-black tracking-tight leading-[0.95] text-foreground text-left">
            {accreditation.event_name}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Detalle y edición de la acreditación
          </SheetDescription>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-muted-foreground">
            {accreditation.venue_name && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                {accreditation.venue_name}
              </span>
            )}
            {accreditation.event_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                {new Date(accreditation.event_date + 'T12:00:00').toLocaleDateString('es', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            )}
            {teamCount > 0 && (
              <span className="flex items-center gap-1.5">
                <User className="h-3 w-3" />
                {confirmedCount}/{teamCount} confirmados
              </span>
            )}
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="px-6 py-6 space-y-7">
          {/* Status */}
          <Section title="Estado">
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as AccreditationStatus })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {ACCREDITATION_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          {/* Event */}
          <Section title="Evento">
            <Field label="Nombre del evento">
              <Input
                value={form.event_name}
                onChange={(e) => setForm({ ...form, event_name: e.target.value })}
              />
            </Field>
            <Field label="Venue">
              <Input
                value={form.venue_name}
                onChange={(e) => setForm({ ...form, venue_name: e.target.value })}
                placeholder="Nombre del venue"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha del evento">
                <Input
                  type="date"
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                />
              </Field>
              <Field label="Deadline">
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </Field>
            </div>
          </Section>

          {/* Contact */}
          <Section title="Contacto">
            <Field label="Nombre">
              <Input
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                placeholder="Persona de contacto"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email" icon={<Mail className="h-3 w-3" />}>
                <Input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  placeholder="email@ejemplo.com"
                />
              </Field>
              <Field label="Teléfono" icon={<Phone className="h-3 w-3" />}>
                <Input
                  type="tel"
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  placeholder="+57 ..."
                />
              </Field>
            </div>
          </Section>

          {/* Proposal */}
          <Section title="Propuesta">
            <Field label="URL de la propuesta">
              <div className="flex gap-2">
                <Input
                  value={form.proposal_url}
                  onChange={(e) => setForm({ ...form, proposal_url: e.target.value })}
                  placeholder="https://..."
                />
                {form.proposal_url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(form.proposal_url, '_blank')}
                    aria-label="Abrir propuesta"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </Field>
          </Section>

          {/* Notes */}
          <Section title="Notas">
            <Field label="Notas internas">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Notas para el equipo..."
              />
            </Field>
            <Field label="Respuesta de la promotora">
              <Textarea
                value={form.response_notes}
                onChange={(e) => setForm({ ...form, response_notes: e.target.value })}
                rows={3}
                placeholder="Comentarios o respuesta recibida..."
              />
            </Field>
          </Section>

          {/* Team (read-only) */}
          {teamCount > 0 && (
            <Section title="Equipo asignado">
              <ul className="space-y-2 text-sm">
                {accreditation.event_team_assignments!.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2"
                  >
                    <span className="font-medium">
                      {[t.profiles?.first_name, t.profiles?.last_name]
                        .filter(Boolean)
                        .join(' ') ||
                        t.profiles?.username ||
                        'Sin nombre'}
                    </span>
                    <span
                      className={
                        t.confirmed
                          ? 'text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-500'
                          : 'text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground'
                      }
                    >
                      {t.confirmed ? 'Confirmado' : 'Pendiente'}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 flex items-center justify-between gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar acreditación?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. La acreditación de "{accreditation.event_name}" será eliminada permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateAccreditation.isPending}>
              {updateAccreditation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}
