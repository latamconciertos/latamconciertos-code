import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Venue, City, VenueFormData } from './types';

interface VenueFormDialogProps {
    open: boolean;
    onClose: () => void;
    venue: Venue | null;
    cities: City[];
    onSubmit: (data: VenueFormData) => Promise<void>;
}

export const VenueFormDialog = ({
    open,
    onClose,
    venue,
    cities,
    onSubmit,
}: VenueFormDialogProps) => {
    const [formData, setFormData] = useState<VenueFormData>({
        name: '',
        slug: '',
        location: '',
        capacity: 0,
        website: '',
        city_id: '',
        country: '',
    });

    // Update form when venue changes
    useEffect(() => {
        if (venue) {
            setFormData({
                name: venue.name,
                slug: venue.slug,
                location: venue.location || '',
                capacity: venue.capacity || 0,
                website: venue.website || '',
                city_id: venue.city_id || '',
                country: venue.country || '',
            });
        } else {
            setFormData({
                name: '',
                slug: '',
                location: '',
                capacity: 0,
                website: '',
                city_id: '',
                country: '',
            });
        }
    }, [venue]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {venue ? 'Editar Venue' : 'Nuevo Venue'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="name">Nombre del Venue</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="Se genera automáticamente"
                            />
                        </div>
                        <div>
                            <Label htmlFor="location">Ubicación</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Dirección o ubicación específica"
                            />
                        </div>
                        <div>
                            <Label htmlFor="capacity">Capacidad</Label>
                            <Input
                                id="capacity"
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                min="0"
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
                        <div>
                            <Label htmlFor="city">Ciudad</Label>
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
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit">
                            {venue ? 'Actualizar' : 'Crear'}
                        </Button>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
