/**
 * Festival Form Component
 * 
 * Reusable form for creating and editing festivals.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, X } from 'lucide-react';
import { ImageUpload } from '../ImageUpload';
import { TicketPriceExtractor } from '../TicketPriceExtractor';
import type { Festival, FestivalFormData } from '@/types/entities/festival';

interface Venue {
  id: string;
  name: string;
  cities?: { name: string } | null;
}

interface Promoter {
  id: string;
  name: string;
}

interface FestivalFormProps {
  festival?: Festival | null;
  venues: Venue[];
  promoters: Promoter[];
  isLoading: boolean;
  onSubmit: (data: FestivalFormData) => void;
  onCancel: () => void;
}

export function FestivalForm({ 
  festival, 
  venues, 
  promoters, 
  isLoading, 
  onSubmit, 
  onCancel 
}: FestivalFormProps) {
  const [formData, setFormData] = useState<FestivalFormData>({
    name: '',
    slug: '',
    description: '',
    start_date: '',
    end_date: '',
    venue_id: '',
    promoter_id: '',
    image_url: '',
    ticket_url: '',
    ticket_prices_html: '',
    edition: null,
    is_featured: false,
  });

  useEffect(() => {
    if (festival) {
      setFormData({
        name: festival.name,
        slug: festival.slug,
        description: festival.description || '',
        start_date: festival.start_date,
        end_date: festival.end_date || '',
        venue_id: festival.venue_id || '',
        promoter_id: festival.promoter_id || '',
        image_url: festival.image_url || '',
        ticket_url: festival.ticket_url || '',
        ticket_prices_html: (festival as any).ticket_prices_html || '',
        edition: festival.edition,
        is_featured: festival.is_featured || false,
      });
    }
  }, [festival]);

  const generateSlug = (name: string) => {
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const timestamp = Date.now();
    return `${baseSlug}-${timestamp}`;
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      slug: formData.slug || generateSlug(formData.name),
    };
    onSubmit(dataToSubmit);
  };

  const handlePricesExtracted = (html: string | null) => {
    setFormData(prev => ({
      ...prev,
      ticket_prices_html: html || '',
    }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {festival ? 'Editar Festival' : 'Nuevo Festival'}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Festival *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ej: Lollapalooza Chile 2025"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="Se genera automáticamente"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha de Inicio *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Fecha de Fin</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edition">Edición</Label>
              <Input
                id="edition"
                type="number"
                value={formData.edition || ''}
                onChange={(e) => setFormData({ ...formData, edition: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Ej: 2025"
                min={1}
              />
            </div>
          </div>

          {/* Venue & Promoter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="venue_id">Venue</Label>
              <Select
                value={formData.venue_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, venue_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar venue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin venue</SelectItem>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name} {venue.cities?.name ? `(${venue.cities.name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="promoter_id">Promotora</Label>
              <Select
                value={formData.promoter_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, promoter_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar promotora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin promotora</SelectItem>
                  {promoters.map((promoter) => (
                    <SelectItem key={promoter.id} value={promoter.id}>
                      {promoter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del festival..."
              rows={4}
            />
          </div>

          {/* Image */}
          <div className="space-y-4">
            <Label>Imagen del Festival</Label>
            <ImageUpload
              currentImageUrl={formData.image_url}
              onImageUploaded={(url) => setFormData({ ...formData, image_url: url })}
              bucket="concert"
            />
            <div className="space-y-2">
              <Label htmlFor="image_url" className="text-sm text-muted-foreground">
                O ingresar URL de imagen directamente
              </Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
          </div>

          {/* Ticket URL */}
          <div className="space-y-2">
            <Label htmlFor="ticket_url">URL de Tickets</Label>
            <Input
              id="ticket_url"
              type="url"
              value={formData.ticket_url}
              onChange={(e) => setFormData({ ...formData, ticket_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {/* Ticket Price Extractor */}
          <div className="space-y-2">
            <TicketPriceExtractor
              ticketUrl={formData.ticket_url}
              initialPricesHtml={formData.ticket_prices_html}
              onPricesExtracted={handlePricesExtracted}
              compact
            />
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="is_featured">Destacar Festival</Label>
              <p className="text-sm text-muted-foreground">
                Mostrar este festival en la sección de destacados
              </p>
            </div>
            <Switch
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {festival ? 'Actualizar' : 'Crear'} Festival
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
