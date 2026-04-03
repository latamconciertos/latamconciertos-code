import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit, Plus, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  useAdminPromoters, 
  useCreatePromoter, 
  useUpdatePromoter, 
  useDeletePromoter 
} from '@/hooks/queries/useAdminPromoters';
import { promoterSchema } from '@/lib/validation';
import type { Promoter } from '@/types/entities';

export const PromotersAdmin = () => {
  // React Query hooks
  const { data: promoters = [], isLoading } = useAdminPromoters();
  const createPromoter = useCreatePromoter();
  const updatePromoter = useUpdatePromoter();
  const deletePromoter = useDeletePromoter();

  // Local UI state
  const [editingPromoter, setEditingPromoter] = useState<Promoter | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
    const validation = promoterSchema.safeParse(formData);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message).join(', ');
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
          }
        });
      } else {
        await createPromoter.mutateAsync({
          name: validation.data.name,
          description: validation.data.description || null,
          website: validation.data.website || null,
        });
      }
      resetForm();
    } catch (error) {
      // Error handled by mutation hooks
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

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta promotora?')) return;

    try {
      await deletePromoter.mutateAsync(id);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      website: '',
    });
    setEditingPromoter(null);
    setShowForm(false);
  };

  const filteredPromoters = promoters.filter(promoter =>
    promoter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (promoter.description && promoter.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Promotoras</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Promotora
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Búsqueda"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingPromoter ? 'Editar Promotora' : 'Nueva Promotora'}
            </CardTitle>
          </CardHeader>
          <CardContent>
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

              <div className="flex gap-2">
                <Button type="submit">
                  {editingPromoter ? 'Actualizar' : 'Crear'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {filteredPromoters.map((promoter) => (
          <Card key={promoter.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{promoter.name}</h3>
                  {promoter.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {promoter.description}
                    </p>
                  )}
                  {promoter.website && (
                    <a 
                      href={promoter.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline mt-2 inline-block"
                    >
                      {promoter.website}
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(promoter)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(promoter.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
