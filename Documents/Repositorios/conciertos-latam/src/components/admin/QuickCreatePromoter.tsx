import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queries/queryKeys';

interface QuickCreatePromoterProps {
    onPromoterCreated: (promoterId: string) => void;
}

export const QuickCreatePromoter = ({ onPromoterCreated }: QuickCreatePromoterProps) => {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        website: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('El nombre del promotor es requerido');
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('promoters')
                .insert([{
                    name: formData.name.trim(),
                    description: formData.description.trim() || null,
                    website: formData.website.trim() || null,
                }])
                .select()
                .single();

            if (error) throw error;

            // Invalidate React Query cache to refresh PromotersAdmin
            queryClient.invalidateQueries({ queryKey: queryKeys.promoters.all });

            toast.success('Promotor creado exitosamente');
            onPromoterCreated(data.id);
            setOpen(false);
            setFormData({ name: '', description: '', website: '' });
        } catch (error: any) {
            toast.error(`Error al crear promotor: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(true)}
                className="shrink-0"
            >
                <Plus className="w-4 h-4 mr-1" />
                Nuevo
            </Button>

            <Dialog open={open} onOpenChange={setOpen} modal={false}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Crear Promotor Rápido</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="quick-promoter-name">Nombre del Promotor *</Label>
                            <Input
                                id="quick-promoter-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Live Nation"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <Label htmlFor="quick-promoter-description">Descripción (opcional)</Label>
                            <Textarea
                                id="quick-promoter-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Breve descripción del promotor..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label htmlFor="quick-promoter-website">Sitio Web (opcional)</Label>
                            <Input
                                id="quick-promoter-website"
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creando...
                                    </>
                                ) : (
                                    'Crear Promotor'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};
