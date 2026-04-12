import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Phone,
  Mail,
  MessageCircle,
  Building2,
  User,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from '@/hooks/queries/useContacts';
import { supabase } from '@/integrations/supabase/client';
import type { ContactWithPromoter, ContactInsert } from '@/types/entities';

interface Promoter {
  id: string;
  name: string;
}

const NONE = '_none_';

const emptyForm: ContactInsert = {
  name: '',
  role: '',
  email: '',
  phone: '',
  whatsapp: '',
  promoter_id: null,
  company: '',
  notes: '',
};

export const ContactsAdmin = () => {
  const { data: contacts = [], isLoading } = useContacts();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPromoter, setFilterPromoter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContactInsert>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<ContactWithPromoter | null>(null);

  useEffect(() => {
    const fetchPromoters = async () => {
      const { data } = await supabase.from('promoters').select('id, name').order('name');
      if (data) setPromoters(data);
    };
    fetchPromoters();
  }, []);

  const filtered = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.role ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPromoter =
      filterPromoter === 'all' ||
      (filterPromoter === 'none' ? !c.promoter_id : c.promoter_id === filterPromoter);
    return matchesSearch && matchesPromoter;
  });

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (c: ContactWithPromoter) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      role: c.role ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      whatsapp: c.whatsapp ?? '',
      promoter_id: c.promoter_id,
      company: c.company ?? '',
      notes: c.notes ?? '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      promoter_id: formData.promoter_id || null,
    };
    try {
      if (editingId) {
        await updateContact.mutateAsync({ id: editingId, data: payload });
      } else {
        await createContact.mutateAsync(payload);
      }
      setFormOpen(false);
    } catch {}
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Agenda de Contactos</h2>
          <p className="text-muted-foreground">
            Directorio de contactos de la industria
          </p>
        </div>
        <Button onClick={openCreate} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo contacto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterPromoter} onValueChange={setFilterPromoter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Promotora" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las promotoras</SelectItem>
            <SelectItem value="none">Sin promotora</SelectItem>
            {promoters.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contacts grid */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Cargando...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay contactos{searchTerm && ' para esa búsqueda'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{c.name}</h3>
                    {c.role && (
                      <p className="text-sm text-muted-foreground truncate">{c.role}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(c)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setDeleteTarget(c)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>

                {/* Promoter / Company */}
                {(c.promoters?.name || c.company) && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">
                      {c.promoters?.name || c.company}
                    </span>
                    {c.promoters?.name && c.company && (
                      <span className="text-xs text-muted-foreground">· {c.company}</span>
                    )}
                  </div>
                )}

                {/* Contact info */}
                <div className="space-y-1.5">
                  {c.email && (
                    <button
                      onClick={() => copyToClipboard(c.email!, 'Email')}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full group"
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{c.email}</span>
                      <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0" />
                    </button>
                  )}
                  {c.phone && (
                    <button
                      onClick={() => copyToClipboard(c.phone!, 'Teléfono')}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full group"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{c.phone}</span>
                      <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0" />
                    </button>
                  )}
                  {c.whatsapp && (
                    <a
                      href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-green-500 hover:text-green-400"
                    >
                      <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>

                {c.notes && (
                  <p className="text-xs text-muted-foreground mt-3 line-clamp-2 border-t pt-2">
                    {c.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar contacto' : 'Nuevo contacto'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre completo"
                required
              />
            </div>
            <div>
              <Label>Cargo / Rol</Label>
              <Input
                value={formData.role ?? ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Ej: Director de prensa, PR Manager"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email ?? ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={formData.phone ?? ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+57 300 123 4567"
                />
              </div>
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input
                value={formData.whatsapp ?? ''}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="+57 300 123 4567"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Promotora</Label>
                <Select
                  value={formData.promoter_id ?? NONE}
                  onValueChange={(v) =>
                    setFormData({ ...formData, promoter_id: v === NONE ? null : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ninguna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Ninguna</SelectItem>
                    {promoters.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Empresa</Label>
                <Input
                  value={formData.company ?? ''}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Nombre de empresa"
                />
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={formData.notes ?? ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Notas adicionales..."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">
                {editingId ? 'Guardar' : 'Crear contacto'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará a <strong>{deleteTarget?.name}</strong> de la agenda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { deleteTarget && deleteContact.mutate(deleteTarget.id); setDeleteTarget(null); }}
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
