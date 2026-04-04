import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Save, Loader2 } from 'lucide-react';

interface SiteBanner {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  link: string | null;
  active: boolean;
  bg_color_from: string;
  bg_color_to: string;
}

export const BannersAdmin = () => {
  const [banners, setBanners] = useState<SiteBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('site_banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (banner: SiteBanner) => {
    setSaving(banner.id);
    try {
      const { error } = await (supabase as any)
        .from('site_banners')
        .update({ active: !banner.active, updated_at: new Date().toISOString() })
        .eq('id', banner.id);

      if (error) throw error;

      setBanners(prev =>
        prev.map(b => (b.id === banner.id ? { ...b, active: !b.active } : b))
      );

      toast({
        title: !banner.active ? 'Banner activado' : 'Banner desactivado',
        description: `"${banner.title}" ${!banner.active ? 'ahora es visible' : 'ya no es visible'} en el home`,
      });
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const handleSave = async (banner: SiteBanner) => {
    setSaving(banner.id);
    try {
      const { error } = await (supabase as any)
        .from('site_banners')
        .update({
          title: banner.title,
          description: banner.description,
          link: banner.link,
          bg_color_from: banner.bg_color_from,
          bg_color_to: banner.bg_color_to,
          updated_at: new Date().toISOString(),
        })
        .eq('id', banner.id);

      if (error) throw error;

      toast({ title: 'Guardado', description: 'Banner actualizado correctamente' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const updateBanner = (id: string, field: keyof SiteBanner, value: string) => {
    setBanners(prev =>
      prev.map(b => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Banners del Sitio</h2>
        <p className="text-muted-foreground mt-1">
          Activa o desactiva banners promocionales en el home
        </p>
      </div>

      {banners.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay banners configurados</p>
          </CardContent>
        </Card>
      )}

      {banners.map(banner => (
        <Card key={banner.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  {banner.slug}
                </CardTitle>
                <CardDescription>
                  {banner.active ? 'Visible en el home' : 'Oculto'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor={`toggle-${banner.id}`} className="text-sm">
                  {banner.active ? 'Activo' : 'Inactivo'}
                </Label>
                <Switch
                  id={`toggle-${banner.id}`}
                  checked={banner.active}
                  onCheckedChange={() => handleToggle(banner)}
                  disabled={saving === banner.id}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview */}
            <div
              className="rounded-xl p-4 text-white"
              style={{
                background: `linear-gradient(135deg, ${banner.bg_color_from}, ${banner.bg_color_to})`,
              }}
            >
              <p className="font-bold">{banner.title}</p>
              {banner.description && (
                <p className="text-sm text-white/70">{banner.description}</p>
              )}
            </div>

            {/* Form */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Titulo</Label>
                <Input
                  value={banner.title}
                  onChange={e => updateBanner(banner.id, 'title', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Link</Label>
                <Input
                  value={banner.link || ''}
                  onChange={e => updateBanner(banner.id, 'link', e.target.value)}
                  placeholder="/wrapped"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Descripcion</Label>
                <Input
                  value={banner.description || ''}
                  onChange={e => updateBanner(banner.id, 'description', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Color desde</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={banner.bg_color_from}
                    onChange={e => updateBanner(banner.id, 'bg_color_from', e.target.value)}
                    className="h-9 w-12 rounded border cursor-pointer"
                  />
                  <Input
                    value={banner.bg_color_from}
                    onChange={e => updateBanner(banner.id, 'bg_color_from', e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color hasta</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={banner.bg_color_to}
                    onChange={e => updateBanner(banner.id, 'bg_color_to', e.target.value)}
                    className="h-9 w-12 rounded border cursor-pointer"
                  />
                  <Input
                    value={banner.bg_color_to}
                    onChange={e => updateBanner(banner.id, 'bg_color_to', e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={() => handleSave(banner)}
              disabled={saving === banner.id}
              className="w-full sm:w-auto"
            >
              {saving === banner.id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar cambios
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
