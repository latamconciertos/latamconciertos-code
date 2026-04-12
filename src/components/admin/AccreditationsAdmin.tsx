import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMemo } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Users,
  UserPlus,
  X,
  CheckCircle2,
  Circle,
  ExternalLink,
} from 'lucide-react';
import {
  useAccreditations,
  useCreateAccreditation,
  useUpdateAccreditation,
  useDeleteAccreditation,
  useAddTeamMember,
  useRemoveTeamMember,
  useToggleTeamConfirmation,
} from '@/hooks/queries/useAccreditations';
import { useNewsFormAuthors, useAccreditationEvents } from '@/hooks/queries/useNewsFormEntities';
import { useContacts } from '@/hooks/queries/useContacts';
import type {
  AccreditationWithTeam,
  AccreditationInsert,
  AccreditationStatus,
  TeamRole,
} from '@/types/entities';
import {
  ACCREDITATION_STATUS_LABELS,
  TEAM_ROLE_LABELS,
} from '@/types/entities';

const STATUS_COLORS: Record<AccreditationStatus, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  submitted: 'bg-blue-500/20 text-blue-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  expired: 'bg-gray-500/20 text-gray-500',
};

const emptyForm: AccreditationInsert = {
  event_name: '',
  venue_name: '',
  event_date: '',
  deadline: '',
  status: 'draft',
  concert_id: null,
  festival_id: null,
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  proposal_url: '',
  notes: '',
};

const MANUAL_VALUE = '_manual_';

export const AccreditationsAdmin = () => {
  const { data: accreditations = [], isLoading } = useAccreditations();
  const { data: admins = [] } = useNewsFormAuthors();
  const { data: events = [] } = useAccreditationEvents();
  const { data: contacts = [] } = useContacts();
  const createAccreditation = useCreateAccreditation();
  const updateAccreditation = useUpdateAccreditation();
  const deleteAccreditation = useDeleteAccreditation();
  const addTeamMember = useAddTeamMember();
  const removeTeamMember = useRemoveTeamMember();
  const toggleConfirmation = useToggleTeamConfirmation();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPromoter, setFilterPromoter] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AccreditationInsert>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<AccreditationWithTeam | null>(null);
  const [teamDialogId, setTeamDialogId] = useState<string | null>(null);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamRole>('periodista');
  const [isManualEvent, setIsManualEvent] = useState(false);
  const [selectedConcertId, setSelectedConcertId] = useState('');

  const promoterOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of accreditations) {
      const pid = a.concerts?.promoter_id;
      const pname = a.concerts?.promoter_name;
      if (pid && pname) map.set(pid, pname);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [accreditations]);

  const yearOptions = useMemo(() => {
    const set = new Set<string>();
    for (const a of accreditations) {
      const date = a.event_date ?? a.deadline;
      if (date) set.add(date.slice(0, 4));
    }
    return Array.from(set).sort().reverse();
  }, [accreditations]);

  const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const filtered = accreditations.filter((a) => {
    const matchesSearch =
      a.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.venue_name ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchesPromoter =
      filterPromoter === 'all' || a.concerts?.promoter_id === filterPromoter;
    const matchesYear = (() => {
      if (filterYear === 'all') return true;
      const date = a.event_date ?? a.deadline;
      return date?.startsWith(filterYear);
    })();
    const matchesMonth = (() => {
      if (filterMonth === 'all') return true;
      const date = a.event_date ?? a.deadline;
      return date?.slice(5, 7) === filterMonth;
    })();
    return matchesSearch && matchesStatus && matchesPromoter && matchesYear && matchesMonth;
  });

  const calcBusinessDaysBefore = (dateStr: string, businessDays: number): string => {
    const date = new Date(dateStr + 'T12:00:00');
    let remaining = businessDays;
    while (remaining > 0) {
      date.setDate(date.getDate() - 1);
      const dow = date.getDay();
      if (dow !== 0 && dow !== 6) remaining--;
    }
    return date.toISOString().slice(0, 10);
  };

  const handleEventSelect = (eventId: string) => {
    if (eventId === MANUAL_VALUE) {
      setIsManualEvent(true);
      setSelectedConcertId('');
      setFormData({ ...formData, concert_id: null, festival_id: null, event_name: '', venue_name: '', event_date: '' });
      return;
    }
    setIsManualEvent(false);
    setSelectedConcertId(eventId);
    const event = events.find((e) => e.id === eventId);
    if (event) {
      const businessDays = event.type === 'festival' ? 30 : 17;
      const autoDeadline = event.date ? calcBusinessDaysBefore(event.date, businessDays) : '';
      setFormData({
        ...formData,
        concert_id: event.type === 'concert' ? event.id : null,
        festival_id: event.type === 'festival' ? event.id : null,
        event_name: event.title,
        event_date: event.date ?? '',
        deadline: autoDeadline,
      });
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIsManualEvent(false);
    setSelectedConcertId('');
    setFormOpen(true);
  };

  const openEdit = (a: AccreditationWithTeam) => {
    setEditingId(a.id);
    const linkedId = a.concert_id || a.festival_id;
    setIsManualEvent(!linkedId);
    setSelectedConcertId(linkedId ?? '');
    setFormData({
      concert_id: a.concert_id,
      festival_id: a.festival_id,
      event_name: a.event_name,
      venue_name: a.venue_name ?? '',
      event_date: a.event_date ?? '',
      deadline: a.deadline,
      status: a.status,
      contact_name: a.contact_name ?? '',
      contact_email: a.contact_email ?? '',
      contact_phone: a.contact_phone ?? '',
      proposal_url: (a as any).proposal_url ?? '',
      notes: a.notes ?? '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateAccreditation.mutateAsync({ id: editingId, data: formData });
      } else {
        await createAccreditation.mutateAsync(formData);
      }
      setFormOpen(false);
    } catch {}
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteAccreditation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleAddMember = async () => {
    if (!teamDialogId || !newMemberUserId) return;
    await addTeamMember.mutateAsync({
      accreditation_id: teamDialogId,
      user_id: newMemberUserId,
      role: newMemberRole,
    });
    setNewMemberUserId('');
    setNewMemberRole('periodista');
  };

  const teamDialogAccreditation = accreditations.find((a) => a.id === teamDialogId);

  const daysBetween = (deadline: string) => {
    const d = new Date(deadline);
    return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Acreditaciones</h2>
          <p className="text-muted-foreground">
            Gestiona propuestas y asigna equipo a eventos
          </p>
        </div>
        <Button onClick={openCreate} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Nueva acreditación
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre de evento o venue..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground mr-1">Filtros:</span>

        <FilterSelect
          label="Estado"
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: 'all', label: 'Todos' },
            ...Object.entries(ACCREDITATION_STATUS_LABELS).map(([k, v]) => ({ value: k, label: v })),
          ]}
        />

        {promoterOptions.length > 0 && (
          <FilterSelect
            label="Promotora"
            value={filterPromoter}
            onChange={setFilterPromoter}
            options={[
              { value: 'all', label: 'Todas' },
              ...promoterOptions.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        )}

        <FilterSelect
          label="Año"
          value={filterYear}
          onChange={setFilterYear}
          options={[
            { value: 'all', label: 'Todos' },
            ...yearOptions.map((y) => ({ value: y, label: y })),
          ]}
        />

        <FilterSelect
          label="Mes"
          value={filterMonth}
          onChange={setFilterMonth}
          options={[
            { value: 'all', label: 'Todos' },
            ...MONTH_NAMES.map((name, i) => ({
              value: String(i + 1).padStart(2, '0'),
              label: name,
            })),
          ]}
        />

        {(filterStatus !== 'all' || filterPromoter !== 'all' || filterYear !== 'all' || filterMonth !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground h-7 px-2"
            onClick={() => {
              setFilterStatus('all');
              setFilterPromoter('all');
              setFilterYear('all');
              setFilterMonth('all');
            }}
          >
            <X className="h-3 w-3 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Cargando...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay acreditaciones
            {filterStatus !== 'all' && ' con ese estado'}
            {searchTerm && ' para esa búsqueda'}
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card">
          <div className="grid grid-cols-12 gap-3 p-3 bg-muted/50 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
            <div className="col-span-3">Evento</div>
            <div className="col-span-2">Fecha evento</div>
            <div className="col-span-2">Deadline</div>
            <div className="col-span-1">Estado</div>
            <div className="col-span-2">Equipo</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>
          <div className="divide-y">
            {filtered.map((a) => {
              const days = daysBetween(a.deadline);
              const isUrgent =
                ['draft', 'pending'].includes(a.status) && days <= 3 && days >= 0;
              const isOverdue =
                ['draft', 'pending'].includes(a.status) && days < 0;

              return (
                <div
                  key={a.id}
                  className={`grid grid-cols-12 gap-3 p-3 items-center transition-colors ${
                    isOverdue
                      ? 'bg-red-500/5'
                      : isUrgent
                        ? 'bg-yellow-500/5'
                        : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="col-span-3">
                    <p className="text-sm font-medium truncate">{a.event_name}</p>
                    {a.venue_name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {a.venue_name}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {a.event_date
                      ? new Date(a.event_date + 'T12:00:00').toLocaleDateString('es', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm">
                      {new Date(a.deadline + 'T12:00:00').toLocaleDateString('es', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </p>
                    {isOverdue && (
                      <p className="text-xs text-red-500 font-medium">Vencida</p>
                    )}
                    {isUrgent && (
                      <p className="text-xs text-yellow-500 font-medium">
                        {days === 0 ? 'Hoy' : `En ${days} días`}
                      </p>
                    )}
                  </div>
                  <div className="col-span-1">
                    <Badge className={STATUS_COLORS[a.status]}>
                      {ACCREDITATION_STATUS_LABELS[a.status]}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <div className="flex flex-wrap gap-1">
                      {(a.event_team_assignments ?? []).map((t) => (
                        <Badge
                          key={t.id}
                          variant={t.confirmed ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {t.profiles?.first_name || t.profiles?.username || '?'}
                        </Badge>
                      ))}
                      {(a.event_team_assignments?.length ?? 0) === 0 && (
                        <span className="text-xs text-muted-foreground">Sin equipo</span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-end gap-1">
                    {(a as any).proposal_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open((a as any).proposal_url, '_blank')}
                        title="Ver propuesta"
                      >
                        <ExternalLink className="h-4 w-4 text-blue-400" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setTeamDialogId(a.id)}
                      title="Gestionar equipo"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(a)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(a)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create/Edit form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar acreditación' : 'Nueva acreditación'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Concert selector */}
            <div>
              <Label>Evento</Label>
              <Select
                value={isManualEvent ? MANUAL_VALUE : selectedConcertId || undefined}
                onValueChange={handleEventSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un concierto o festival" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MANUAL_VALUE}>
                    <span className="text-muted-foreground">Evento externo (manual)</span>
                  </SelectItem>
                  {events.map((e) => {
                    const dateStr = e.date
                      ? e.date.split('-').reverse().join('/')
                      : 'Sin fecha';
                    const typeLabel = e.type === 'festival' ? '🎪' : '🎵';
                    return (
                      <SelectItem key={`${e.type}-${e.id}`} value={e.id}>
                        {typeLabel} {e.title} — {dateStr}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Auto-filled or manual fields */}
            {!isManualEvent && selectedConcertId ? (
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p className="text-sm font-medium">{formData.event_name}</p>
                {formData.event_date && (
                  <p className="text-xs text-muted-foreground">
                    Fecha: {new Date(formData.event_date + 'T12:00:00').toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            ) : isManualEvent ? (
              <>
                <div>
                  <Label>Nombre del evento *</Label>
                  <Input
                    value={formData.event_name}
                    onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                    placeholder="Ej: Lollapalooza Chile 2026"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Venue</Label>
                    <Input
                      value={formData.venue_name ?? ''}
                      onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                      placeholder="Ej: Parque O'Higgins"
                    />
                  </div>
                  <div>
                    <Label>Fecha del evento</Label>
                    <Input
                      type="date"
                      value={formData.event_date ?? ''}
                      onChange={(e) => {
                        const date = e.target.value;
                        const autoDeadline = date ? calcBusinessDaysBefore(date, 17) : formData.deadline;
                        setFormData({ ...formData, event_date: date, deadline: autoDeadline });
                      }}
                    />
                  </div>
                </div>
              </>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Deadline de entrega *</Label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  required
                />
                {formData.deadline && formData.event_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculado automáticamente. Puedes ajustarlo.
                  </p>
                )}
              </div>
              <div>
                <Label>Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      status: v as AccreditationStatus,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACCREDITATION_STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Contacto del evento</p>
              <div>
                <Label>Contacto</Label>
                <Select
                  value={
                    contacts.find(
                      (c) =>
                        c.name === formData.contact_name &&
                        c.email === formData.contact_email,
                    )?.id ?? '_custom_'
                  }
                  onValueChange={(v) => {
                    if (v === '_custom_') {
                      setFormData({
                        ...formData,
                        contact_name: '',
                        contact_email: '',
                        contact_phone: '',
                      });
                      return;
                    }
                    const contact = contacts.find((c) => c.id === v);
                    if (contact) {
                      setFormData({
                        ...formData,
                        contact_name: contact.name,
                        contact_email: contact.email ?? '',
                        contact_phone: contact.phone ?? '',
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar de la agenda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_custom_">
                      <span className="text-muted-foreground">Escribir manualmente</span>
                    </SelectItem>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.promoters?.name ? ` · ${c.promoters.name}` : ''}
                        {c.role ? ` — ${c.role}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.contact_name && (
                <div className="mt-3 rounded-lg bg-muted/50 p-3 space-y-1">
                  <p className="text-sm font-medium">{formData.contact_name}</p>
                  {formData.contact_email && (
                    <p className="text-xs text-muted-foreground">{formData.contact_email}</p>
                  )}
                  {formData.contact_phone && (
                    <p className="text-xs text-muted-foreground">{formData.contact_phone}</p>
                  )}
                </div>
              )}
            </div>
            <div>
              <Label>Link de propuesta</Label>
              <Input
                value={formData.proposal_url ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, proposal_url: e.target.value })
                }
                placeholder="https://www.canva.com/design/..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Pega el link de Canva, Google Docs o cualquier documento
              </p>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={formData.notes ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                placeholder="Requisitos especiales, documentos necesarios..."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">
                {editingId ? 'Guardar cambios' : 'Crear acreditación'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Team assignment dialog */}
      <Dialog
        open={!!teamDialogId}
        onOpenChange={(open) => !open && setTeamDialogId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Equipo — {teamDialogAccreditation?.event_name}
            </DialogTitle>
          </DialogHeader>

          {/* Current members */}
          <div className="space-y-2">
            {(teamDialogAccreditation?.event_team_assignments ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-3 text-center">
                No hay miembros asignados
              </p>
            ) : (
              teamDialogAccreditation!.event_team_assignments!.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-2 py-2 border-b"
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        toggleConfirmation.mutate({
                          id: t.id,
                          confirmed: !t.confirmed,
                        })
                      }
                      className="shrink-0"
                      title={t.confirmed ? 'Confirmado' : 'Sin confirmar'}
                    >
                      {t.confirmed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <div>
                      <p className="text-sm font-medium">
                        {[t.profiles?.first_name, t.profiles?.last_name]
                          .filter(Boolean)
                          .join(' ') || t.profiles?.username || 'Sin nombre'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {TEAM_ROLE_LABELS[t.role]}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTeamMember.mutate(t.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Add member */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Agregar miembro</p>
            <div className="grid grid-cols-2 gap-2">
              <Select value={newMemberUserId} onValueChange={setNewMemberUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Persona" />
                </SelectTrigger>
                <SelectContent>
                  {admins.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {[a.first_name, a.last_name].filter(Boolean).join(' ') ||
                        a.username ||
                        'Sin nombre'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={newMemberRole}
                onValueChange={(v) => setNewMemberRole(v as TeamRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEAM_ROLE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddMember}
              disabled={!newMemberUserId}
              className="w-full"
              size="sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar acreditación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la acreditación de{' '}
              <strong>{deleteTarget?.event_name}</strong> y todas las
              asignaciones de equipo asociadas.
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
    </div>
  );
};

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const isActive = value !== 'all';
  const selectedLabel = options.find((o) => o.value === value)?.label ?? label;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={`h-8 text-xs gap-1.5 border-dashed rounded-full px-3 ${
          isActive
            ? 'border-primary bg-primary/10 text-primary'
            : 'text-muted-foreground'
        }`}
        style={{ width: 'auto', minWidth: 0 }}
      >
        <span className="font-medium">{label}:</span>
        <span className={isActive ? 'font-semibold' : ''}>{selectedLabel}</span>
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
