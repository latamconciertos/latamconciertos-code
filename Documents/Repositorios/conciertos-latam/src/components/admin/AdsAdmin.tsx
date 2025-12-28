import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Eye, BarChart3 } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'finished';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface AdItem {
  id: string;
  campaign_id: string;
  name: string;
  location: string;
  format: 'banner' | 'rectangle';
  image_url: string;
  link_url: string | null;
  position: 'sidebar-left' | 'sidebar-right' | 'content' | 'footer';
  display_order: number;
  active: boolean;
  clicks: number;
  impressions: number;
}

export const AdsAdmin = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showAdForm, setShowAdForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingAd, setEditingAd] = useState<AdItem | null>(null);

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    status: 'active' as 'active' | 'paused' | 'finished',
    start_date: '',
    end_date: '',
  });

  const [adForm, setAdForm] = useState({
    name: '',
    location: 'homepage',
    format: 'banner' as 'banner' | 'rectangle',
    image_url: '',
    link_url: '',
    position: 'sidebar-right' as 'sidebar-left' | 'sidebar-right' | 'content' | 'footer',
    display_order: 0,
    active: true,
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      fetchAds(selectedCampaign);
    }
  }, [selectedCampaign]);

  const fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from('ad_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar campañas');
      return;
    }

    setCampaigns(data || []);
  };

  const fetchAds = async (campaignId: string) => {
    const { data, error } = await supabase
      .from('ad_items')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('display_order', { ascending: true });

    if (error) {
      toast.error('Error al cargar anuncios');
      return;
    }

    setAds(data || []);
  };

  const handleSaveCampaign = async () => {
    if (!campaignForm.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    const campaignData = {
      name: campaignForm.name,
      status: campaignForm.status,
      start_date: campaignForm.start_date || null,
      end_date: campaignForm.end_date || null,
    };

    if (editingCampaign) {
      const { error } = await supabase
        .from('ad_campaigns')
        .update(campaignData)
        .eq('id', editingCampaign.id);

      if (error) {
        toast.error('Error al actualizar campaña');
        return;
      }
      toast.success('Campaña actualizada');
    } else {
      const { error } = await supabase
        .from('ad_campaigns')
        .insert([campaignData]);

      if (error) {
        toast.error('Error al crear campaña');
        return;
      }
      toast.success('Campaña creada');
    }

    resetCampaignForm();
    fetchCampaigns();
  };

  const handleSaveAd = async () => {
    if (!selectedCampaign) {
      toast.error('Selecciona una campaña primero');
      return;
    }

    if (!adForm.name.trim() || !adForm.image_url.trim()) {
      toast.error('El nombre e imagen son requeridos');
      return;
    }

    const adData = {
      campaign_id: selectedCampaign,
      name: adForm.name,
      location: adForm.location,
      format: adForm.format,
      image_url: adForm.image_url,
      link_url: adForm.link_url || null,
      position: adForm.position,
      display_order: adForm.display_order,
      active: adForm.active,
    };

    if (editingAd) {
      const { error } = await supabase
        .from('ad_items')
        .update(adData)
        .eq('id', editingAd.id);

      if (error) {
        toast.error('Error al actualizar anuncio');
        return;
      }
      toast.success('Anuncio actualizado');
    } else {
      const { error } = await supabase
        .from('ad_items')
        .insert([adData]);

      if (error) {
        toast.error('Error al crear anuncio');
        return;
      }
      toast.success('Anuncio creado');
    }

    resetAdForm();
    if (selectedCampaign) fetchAds(selectedCampaign);
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('¿Eliminar esta campaña y todos sus anuncios?')) return;

    const { error } = await supabase
      .from('ad_campaigns')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Error al eliminar campaña');
      return;
    }

    toast.success('Campaña eliminada');
    fetchCampaigns();
    if (selectedCampaign === id) {
      setSelectedCampaign(null);
      setAds([]);
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm('¿Eliminar este anuncio?')) return;

    const { error } = await supabase
      .from('ad_items')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Error al eliminar anuncio');
      return;
    }

    toast.success('Anuncio eliminado');
    if (selectedCampaign) fetchAds(selectedCampaign);
  };

  const toggleAdActive = async (ad: AdItem) => {
    const { error } = await supabase
      .from('ad_items')
      .update({ active: !ad.active })
      .eq('id', ad.id);

    if (error) {
      toast.error('Error al actualizar estado');
      return;
    }

    toast.success(ad.active ? 'Anuncio desactivado' : 'Anuncio activado');
    if (selectedCampaign) fetchAds(selectedCampaign);
  };

  const resetCampaignForm = () => {
    setCampaignForm({ name: '', status: 'active', start_date: '', end_date: '' });
    setEditingCampaign(null);
    setShowCampaignForm(false);
  };

  const resetAdForm = () => {
    setAdForm({
      name: '',
      location: 'homepage',
      format: 'banner',
      image_url: '',
      link_url: '',
      position: 'sidebar-right',
      display_order: 0,
      active: true,
    });
    setEditingAd(null);
    setShowAdForm(false);
  };

  const editCampaign = (campaign: Campaign) => {
    setCampaignForm({
      name: campaign.name,
      status: campaign.status,
      start_date: campaign.start_date || '',
      end_date: campaign.end_date || '',
    });
    setEditingCampaign(campaign);
    setShowCampaignForm(true);
  };

  const editAd = (ad: AdItem) => {
    setAdForm({
      name: ad.name,
      location: ad.location,
      format: ad.format,
      image_url: ad.image_url,
      link_url: ad.link_url || '',
      position: ad.position,
      display_order: ad.display_order,
      active: ad.active,
    });
    setEditingAd(ad);
    setShowAdForm(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      paused: 'secondary',
      finished: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Publicidad Interna</h2>
      </div>

      <Tabs defaultValue="configuration" className="w-full">
        <TabsList>
          <TabsTrigger value="configuration">Configuración</TabsTrigger>
          <TabsTrigger value="ads" disabled={!selectedCampaign}>
            Anuncios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Campañas</h3>
            <Button onClick={() => setShowCampaignForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Campaña
            </Button>
          </div>

          {showCampaignForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingCampaign ? 'Editar' : 'Nueva'} Campaña
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nombre</Label>
                  <Input
                    value={campaignForm.name}
                    onChange={(e) =>
                      setCampaignForm({ ...campaignForm, name: e.target.value })
                    }
                    placeholder="Ej: Campaña Verano 2025"
                  />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select
                    value={campaignForm.status}
                    onValueChange={(value: any) =>
                      setCampaignForm({ ...campaignForm, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activa</SelectItem>
                      <SelectItem value="paused">Pausada</SelectItem>
                      <SelectItem value="finished">Finalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fecha inicio (opcional)</Label>
                    <Input
                      type="datetime-local"
                      value={campaignForm.start_date}
                      onChange={(e) =>
                        setCampaignForm({
                          ...campaignForm,
                          start_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Fecha fin (opcional)</Label>
                    <Input
                      type="datetime-local"
                      value={campaignForm.end_date}
                      onChange={(e) =>
                        setCampaignForm({
                          ...campaignForm,
                          end_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveCampaign}>Guardar</Button>
                  <Button variant="outline" onClick={resetCampaignForm}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className={
                  selectedCampaign === campaign.id
                    ? 'border-primary'
                    : ''
                }
              >
                <CardContent className="flex justify-between items-center p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{campaign.name}</h4>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Creada: {new Date(campaign.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCampaign(campaign.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Anuncios
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => editCampaign(campaign)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteCampaign(campaign.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ads" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Anuncios de:{' '}
              {campaigns.find((c) => c.id === selectedCampaign)?.name}
            </h3>
            <Button onClick={() => setShowAdForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Anuncio
            </Button>
          </div>

          {showAdForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingAd ? 'Editar' : 'Nuevo'} Anuncio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nombre de la publicidad</Label>
                  <Input
                    value={adForm.name}
                    onChange={(e) =>
                      setAdForm({ ...adForm, name: e.target.value })
                    }
                    placeholder="Ej: Banner Principal"
                  />
                </div>

                <div>
                  <Label>Ubicación</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="homepage"
                        checked={adForm.location === 'homepage'}
                        onChange={() =>
                          setAdForm({ ...adForm, location: 'homepage' })
                        }
                      />
                      <Label htmlFor="homepage">Página principal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="blog"
                        checked={adForm.location === 'blog'}
                        onChange={() =>
                          setAdForm({ ...adForm, location: 'blog' })
                        }
                      />
                      <Label htmlFor="blog">Noticias</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="concerts"
                        checked={adForm.location === 'concerts'}
                        onChange={() =>
                          setAdForm({ ...adForm, location: 'concerts' })
                        }
                      />
                      <Label htmlFor="concerts">Conciertos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="artists"
                        checked={adForm.location === 'artists'}
                        onChange={() =>
                          setAdForm({ ...adForm, location: 'artists' })
                        }
                      />
                      <Label htmlFor="artists">Artistas</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Formato de visualización</Label>
                  <div className="flex gap-4 mt-2">
                    <Card
                      className={`cursor-pointer p-4 flex-1 ${
                        adForm.format === 'banner' ? 'border-primary' : ''
                      }`}
                      onClick={() => setAdForm({ ...adForm, format: 'banner' })}
                    >
                      <div className="text-center">
                        <div className="aspect-[728/90] bg-muted rounded mb-2"></div>
                        <p className="text-sm">Banner</p>
                        <p className="text-xs text-muted-foreground">728x90</p>
                      </div>
                    </Card>
                    <Card
                      className={`cursor-pointer p-4 flex-1 ${
                        adForm.format === 'rectangle' ? 'border-primary' : ''
                      }`}
                      onClick={() =>
                        setAdForm({ ...adForm, format: 'rectangle' })
                      }
                    >
                      <div className="text-center">
                        <div className="aspect-[300/250] bg-muted rounded mb-2 max-w-[150px] mx-auto"></div>
                        <p className="text-sm">Rectángulo</p>
                        <p className="text-xs text-muted-foreground">300x250</p>
                      </div>
                    </Card>
                  </div>
                </div>

                <div>
                  <Label>Imagen</Label>
                  <ImageUpload
                    currentImageUrl={adForm.image_url}
                    onImageUploaded={(url) =>
                      setAdForm({ ...adForm, image_url: url })
                    }
                    bucket="media"
                  />
                </div>

                <div>
                  <Label>URL de destino (opcional)</Label>
                  <Input
                    value={adForm.link_url}
                    onChange={(e) =>
                      setAdForm({ ...adForm, link_url: e.target.value })
                    }
                    placeholder="https://ejemplo.com"
                  />
                </div>

                <div>
                  <Label>Posición en página</Label>
                  <Select
                    value={adForm.position}
                    onValueChange={(value: any) =>
                      setAdForm({ ...adForm, position: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sidebar-left">Sidebar Izquierdo</SelectItem>
                      <SelectItem value="sidebar-right">Sidebar Derecho</SelectItem>
                      <SelectItem value="content">Contenido</SelectItem>
                      <SelectItem value="footer">Footer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Orden de visualización</Label>
                  <Input
                    type="number"
                    value={adForm.display_order}
                    onChange={(e) =>
                      setAdForm({
                        ...adForm,
                        display_order: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={adForm.active}
                    onCheckedChange={(checked) =>
                      setAdForm({ ...adForm, active: checked })
                    }
                  />
                  <Label>Anuncio activo</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveAd}>Guardar</Button>
                  <Button variant="outline" onClick={resetAdForm}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {ads.map((ad) => (
              <Card key={ad.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={ad.image_url}
                      alt={ad.name}
                      className="w-32 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{ad.name}</h4>
                        {ad.active ? (
                          <Badge variant="default">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                        <Badge variant="outline">{ad.format}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {ad.location} • {ad.position}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {ad.impressions} vistas
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {ad.clicks} clicks
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAdActive(ad)}
                      >
                        {ad.active ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => editAd(ad)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteAd(ad.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
