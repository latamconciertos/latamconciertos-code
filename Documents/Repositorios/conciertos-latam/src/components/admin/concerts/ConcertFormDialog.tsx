import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { TicketPriceExtractor } from '../TicketPriceExtractor';
import { QuickCreateVenue } from '../QuickCreateVenue';
import { QuickCreateArtist } from '../QuickCreateArtist';
import { QuickCreatePromoter } from '../QuickCreatePromoter';
import type { Concert, Artist, Venue, Promoter } from './types';

interface ConcertFormDialogProps {
    open: boolean;
    onClose: () => void;
    concert: Concert | null;
    artists: Artist[];
    venues: Venue[];
    promoters: Promoter[];
    cities: Array<{ id: string; name: string }>;
    onSubmit: (data: ConcertFormData) => Promise<void>;
    selectedFestivalArtists: string[];
    onFestivalArtistsChange: (artistIds: string[]) => void;
    onRefetchArtists: () => void;
    onRefetchVenues: () => void;
    onRefetchPromoters: () => void;
}

export interface ConcertFormData {
    title: string;
    slug: string;
    description: string;
    date: string;
    image_url: string;
    ticket_url: string;
    ticket_prices_html: string;
    artist_id: string;
    venue_id: string;
    promoter_id: string;
    event_type: string;
}

export const ConcertFormDialog = ({
    open,
    onClose,
    concert,
    artists,
    venues,
    promoters,
    cities,
    onSubmit,
    selectedFestivalArtists,
    onFestivalArtistsChange,
    onRefetchArtists,
    onRefetchVenues,
    onRefetchPromoters,
}: ConcertFormDialogProps) => {
    const [formData, setFormData] = useState<ConcertFormData>({
        title: '',
        slug: '',
        description: '',
        date: '',
        image_url: '',
        ticket_url: '',
        ticket_prices_html: '',
        artist_id: '',
        venue_id: '',
        promoter_id: '',
        event_type: 'concert',
    });

    // Update form when concert changes
    useEffect(() => {
        if (concert) {
            setFormData({
                title: concert.title,
                slug: concert.slug,
                description: concert.description || '',
                date: concert.date || '',
                image_url: concert.image_url || '',
                ticket_url: concert.ticket_url || '',
                ticket_prices_html: concert.ticket_prices_html || '',
                artist_id: concert.artist_id || '',
                venue_id: concert.venue_id || '',
                promoter_id: concert.promoter_id || '',
                event_type: concert.event_type || 'concert',
            });
        } else {
            setFormData({
                title: '',
                slug: '',
                description: '',
                date: '',
                image_url: '',
                ticket_url: '',
                ticket_prices_html: '',
                artist_id: '',
                venue_id: '',
                promoter_id: '',
                event_type: 'concert',
            });
        }
    }, [concert]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    const handlePricesExtracted = (html: string | null) => {
        setFormData(prev => ({
            ...prev,
            ticket_prices_html: html || '',
        }));
    };

    const handleArtistCreated = (artistId: string) => {
        // Delay refetch to ensure data is synced
        setTimeout(() => {
            onRefetchArtists();
            setFormData(prev => ({ ...prev, artist_id: artistId }));
        }, 100);
    };

    const handleVenueCreated = (venueId: string) => {
        // Delay refetch to ensure data is synced
        setTimeout(() => {
            onRefetchVenues();
            setFormData(prev => ({ ...prev, venue_id: venueId }));
        }, 100);
    };

    const handlePromoterCreated = (promoterId: string) => {
        // Delay refetch to ensure data is synced
        setTimeout(() => {
            onRefetchPromoters();
            setFormData(prev => ({ ...prev, promoter_id: promoterId }));
        }, 100);
    };

    const toggleFestivalArtist = (artistId: string) => {
        const newArtists = selectedFestivalArtists.includes(artistId)
            ? selectedFestivalArtists.filter(id => id !== artistId)
            : [...selectedFestivalArtists, artistId];
        onFestivalArtistsChange(newArtists);
    };

    const removeFestivalArtist = (artistId: string) => {
        onFestivalArtistsChange(selectedFestivalArtists.filter(id => id !== artistId));
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {concert ? 'Editar Concierto' : 'Nuevo Concierto'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="title">Título del Evento</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                            <Label htmlFor="event_type">Tipo de Evento</Label>
                            <Select
                                value={formData.event_type}
                                onValueChange={(value) => {
                                    setFormData({ ...formData, event_type: value });
                                    if (value === 'concert') {
                                        onFestivalArtistsChange([]);
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="concert">Concierto</SelectItem>
                                    <SelectItem value="festival">Festival</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="date">Fecha del Evento</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        {formData.event_type === 'concert' && (
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <Label htmlFor="artist">Artista</Label>
                                    <QuickCreateArtist onArtistCreated={handleArtistCreated} />
                                </div>
                                <Select
                                    value={formData.artist_id}
                                    onValueChange={(value) => setFormData({ ...formData, artist_id: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar artista" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {artists.map((artist) => (
                                            <SelectItem key={artist.id} value={artist.id}>
                                                {artist.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <Label htmlFor="venue">Venue</Label>
                                <QuickCreateVenue cities={cities} onVenueCreated={handleVenueCreated} />
                            </div>
                            <Select
                                value={formData.venue_id}
                                onValueChange={(value) => setFormData({ ...formData, venue_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar venue" />
                                </SelectTrigger>
                                <SelectContent>
                                    {venues.map((venue) => (
                                        <SelectItem key={venue.id} value={venue.id}>
                                            {venue.cities?.name ? `${venue.name} (${venue.cities.name})` : venue.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <Label htmlFor="promoter">Promotor</Label>
                                <QuickCreatePromoter onPromoterCreated={handlePromoterCreated} />
                            </div>
                            <Select
                                value={formData.promoter_id}
                                onValueChange={(value) => setFormData({ ...formData, promoter_id: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar promotor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {promoters.map((promoter) => (
                                        <SelectItem key={promoter.id} value={promoter.id}>
                                            {promoter.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {formData.event_type === 'festival' && (
                        <div>
                            <Label>Artistas del Festival</Label>
                            <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                                {artists.map((artist) => (
                                    <div key={artist.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`artist-${artist.id}`}
                                            checked={selectedFestivalArtists.includes(artist.id)}
                                            onCheckedChange={() => toggleFestivalArtist(artist.id)}
                                        />
                                        <Label
                                            htmlFor={`artist-${artist.id}`}
                                            className="text-sm font-normal cursor-pointer"
                                        >
                                            {artist.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {selectedFestivalArtists.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Artistas seleccionados ({selectedFestivalArtists.length}):
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedFestivalArtists.map((artistId) => {
                                            const artist = artists.find(a => a.id === artistId);
                                            return artist ? (
                                                <div
                                                    key={artistId}
                                                    className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                                                >
                                                    {artist.name}
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-4 w-4 p-0 hover:bg-transparent"
                                                        onClick={() => removeFestivalArtist(artistId)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="image_url">URL de Imagen</Label>
                            <Input
                                id="image_url"
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="ticket_url">URL de Tickets</Label>
                            <Input
                                id="ticket_url"
                                value={formData.ticket_url}
                                onChange={(e) => setFormData({ ...formData, ticket_url: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Ticket Price Extractor */}
                    <TicketPriceExtractor
                        ticketUrl={formData.ticket_url}
                        initialPricesHtml={formData.ticket_prices_html}
                        onPricesExtracted={handlePricesExtracted}
                        compact
                    />

                    <div className="flex gap-2">
                        <Button type="submit">
                            {concert ? 'Actualizar' : 'Crear'}
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
