import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queries/queryKeys';

interface City {
    id: string;
    name: string;
}

interface QuickCreateVenueProps {
    cities: City[];
    onVenueCreated: (venueId: string) => void;
}

export const QuickCreateVenue = ({ cities, onVenueCreated }: QuickCreateVenueProps) => {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        city_id: '',
        capacity: '',
    });

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('El nombre del venue es requerido');
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('venues')
                .insert([{
                    name: formData.name,
                    slug: generateSlug(formData.name),
                    city_id: formData.city_id || null,
                    capacity: formData.capacity ? parseInt(formData.capacity) : null,
                }])
                .select()
                .single();

            if (error) throw error;

            // Invalidate React Query cache to refresh VenuesAdmin
            queryClient.invalidateQueries({ queryKey: queryKeys.venues.all });

            toast.success('Venue creado exitosamente');
            onVenueCreated(data.id);
            setOpen(false);
            setFormData({ name: '', city_id: '', capacity: '' });
        } catch (error: any) {
            toast.error(`Error al crear venue: ${error.message}`);
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
                        <DialogTitle>Crear Venue Rápido</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="quick-venue-name">Nombre del Venue *</Label>
                            <Input
                                id="quick-venue-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Movistar Arena"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <Label htmlFor="quick-venue-city">Ciudad (opcional)</Label>
                            <Select
                                value={formData.city_id}
                                onValueChange={(value) => setFormData({ ...formData, city_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar ciudad" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cities.map((city) => (
                                        <SelectItem key={city.id} value={city.id}>
                                            {city.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="quick-venue-capacity">Capacidad (opcional)</Label>
                            <Input
                                id="quick-venue-capacity"
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                placeholder="Ej: 15000"
                                min="0"
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
                                    'Crear Venue'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};
