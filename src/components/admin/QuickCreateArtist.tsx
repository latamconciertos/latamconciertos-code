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

interface QuickCreateArtistProps {
    onArtistCreated: (artistId: string) => void;
}

export const QuickCreateArtist = ({ onArtistCreated }: QuickCreateArtistProps) => {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
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
            toast.error('El nombre del artista es requerido');
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('artists')
                .insert([{
                    name: formData.name.trim(),
                    slug: generateSlug(formData.name),
                    bio: formData.bio.trim() || null,
                }])
                .select()
                .single();

            if (error) throw error;

            // Invalidate React Query cache to refresh ArtistsAdmin
            queryClient.invalidateQueries({ queryKey: queryKeys.artists.all });

            toast.success('Artista creado exitosamente');
            onArtistCreated(data.id);
            setOpen(false);
            setFormData({ name: '', bio: '' });
        } catch (error: any) {
            toast.error(`Error al crear artista: ${error.message}`);
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
                        <DialogTitle>Crear Artista Rápido</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="quick-artist-name">Nombre del Artista *</Label>
                            <Input
                                id="quick-artist-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Bad Bunny"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <Label htmlFor="quick-artist-bio">Biografía (opcional)</Label>
                            <Textarea
                                id="quick-artist-bio"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Breve biografía del artista..."
                                rows={3}
                            />
                        </div>

                        <p className="text-xs text-muted-foreground">
                            El slug se generará automáticamente a partir del nombre
                        </p>

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
                                    'Crear Artista'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};
