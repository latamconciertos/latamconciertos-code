import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Trash2, Pencil, Plus, Search, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminPromoters,
  useCreatePromoter,
  useUpdatePromoter,
  useDeletePromoter,
} from '@/hooks/queries/useAdminPromoters';
import { promoterSchema } from '@/lib/validation';
import type { Promoter } from '@/types/entities';

export const PromotersAdmin = () => {
  const { data: promoters = [] } = useAdminPromoters();
  const createPromoter = useCreatePromoter();
  const updatePromoter = useUpdatePromoter();
  const deletePromoter = useDeletePromoter();

  const [editingPromoter, setEditingPromoter] = useState<Promoter | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Promoter | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = promoterSchema.safeParse(formData);
    if (!validation.success) {
      const errors = validation.error.errors.map((err) => err.message).join(', ');
      toast.error(`Error de validación: ${errors}`);
      return;
    }

    try {
      if (editingPromoter) {
        await updatePromoter.mutateAsync({
          id: editingPromoter.id,
          data: {
            name: validation.data.name,
            description: validation.data.description || null,
            website: validation.data.website || null,
          },
        });
      } else {
        await createPromoter.mutateAsync({
          name: validation.data.name,
          description: validation.data.description || null,
          website: validation.data.website || null,
        });
      }
      resetForm();
    } catch {
      // Error handled by mutation
    }
  };

  const handleEdit = (promoter: Promoter) => {
    setEditingPromoter(promoter);
    setFormData({
      name: promoter.name,
      description: promoter.description || '',
      website: promoter.website || '',
    });
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePromoter.mutateAsync(deleteTarget.id);
    } catch {
      // Error handled by mutation
    }
    setDeleteTarget(null);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', website: '' });
    setEditingPromoter(null);
    setShowForm(false);
  };

  const filteredPromoters = useMemo(
    () =>
      (promoters ?? []).filter(
        (promoter) =>
          promoter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (promoter.description &&
            promoter.description.toLowerCase().includes(searchTerm.toLowerCase())),
      ),
    [promoters, searchTerm],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Promotoras</h2>
          <p className="text-muted-foreground">Administra las promotoras de eventos</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Promotora
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o descripción…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <span className="text-sm text-muted-foreground ml-auto">
          {filteredPromoters.length} de {(promoters ?? []).length}
        </span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="grid grid-cols-12 gap-4 px-4 py-2.5 bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <div className="col-span-4">Nombre</div>
          <div className="col-span-5">Descripción</div>
          <div className="col-span-2">Sitio web</div>
          <div className="col-span-1 text-right">Acciones</div>
        </div>

        <div className="divide-y">
          {filteredPromoters.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {searchTerm
                ? 'No se encontraron promotoras.'
                : 'No hay promotoras registradas.'}
            </div>
          ) : (
            filteredPromoters.map((promoter) => (
              <div
                key={promoter.id}
                className="grid grid-cols-12 gap-4 px-4 py-2.5 items-center hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => handleEdit(promoter)}
              >
                <div className="col-span-4 min-w-0">
                  <h3 className="font-medium truncate">{promoter.name}</h3>
                </div>
                <div className="col-span-5 text-sm text-muted-foreground truncate">
                  {promoter.description || <span className="italic">Sin descripción</span>}
                </div>
                <div className="col-span-2 text-sm truncate">
                  {promoter.website ? (
                    <a
                      href={promoter.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">Visitar</span>
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic">—</span>
                  )}
                </div>
                <div className="col-span-1 flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(promoter);
                    }}
                    aria-label="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(promoter);
                    }}
                    aria-label="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPromoter ? 'Editar Promotora' : 'Nueva Promotora'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre de la Promotora</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="website">Sitio Web</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingPromoter ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar promotora?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La promotora{' '}
              <strong>&quot;{deleteTarget?.name}&quot;</strong> será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
