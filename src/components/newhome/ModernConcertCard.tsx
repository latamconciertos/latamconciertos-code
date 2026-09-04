import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck, Share2, MapPin, Music, CalendarCheck, CalendarClock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { parseISO, format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { canShareNatively } from '@/utils/socialShare';
import { getConcertImage } from '@/lib/concertImage';
import { getDefaultImage } from '@/lib/imageOptimization';
import { spotifyService } from '@/lib/spotify';

interface ModernConcertCardProps {
    concert: {
        id: string;
        title: string;
        slug?: string;
        date: string;
        artist_image_url?: string;
        artists?: {
            name: string;
            photo_url?: string | null;
        } | null;
        venues?: {
            name: string;
            cities?: {
                name: string;
            } | null;
        } | null;
    };
    onClick?: () => void;
}

type AttendanceType = 'attending' | 'tentative' | null;

export const ModernConcertCard = ({ concert, onClick }: ModernConcertCardProps) => {
    const navigate = useNavigate();
    const concertDate = parseISO(concert.date);
    const day = format(concertDate, 'd');
    const month = format(concertDate, 'MMM').toUpperCase();

    const artistName = concert.artists?.name || 'Artista';
    const location = concert.venues?.cities?.name || concert.venues?.name || 'Por definir';

    // Una URL de catálogo caducada dejaría el ícono de imagen rota ocupando toda la
    // card: ante el fallo se pinta el placeholder y se reintenta una vez contra
    // Spotify. La búsqueda en vivo solo corre aquí — nunca sobre fotos que sí cargan.
    const fallbackImage = getDefaultImage('concert');
    const [imageOverride, setImageOverride] = useState<string | null>(null);
    const imageUrl = imageOverride ?? getConcertImage(concert, fallbackImage);

    const handleImageError = () => {
        if (imageOverride) {
            // El reintento de Spotify también falló: quedarse con el placeholder.
            if (imageOverride !== fallbackImage) setImageOverride(fallbackImage);
            return;
        }
        setImageOverride(fallbackImage);
        const name = concert.artists?.name;
        if (!name) return;
        spotifyService
            .searchArtist(name)
            .then((fresh) => {
                if (fresh) setImageOverride(fresh);
            })
            .catch(() => { /* queda el placeholder */ });
    };

    // Save/attendance state
    const [attendanceType, setAttendanceType] = useState<AttendanceType>(null);
    const [saving, setSaving] = useState(false);
    const [saveOpen, setSaveOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);

    useEffect(() => {
        const checkSaved = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data } = await supabase
                .from('favorite_concerts')
                .select('attendance_type')
                .eq('user_id', session.user.id)
                .eq('concert_id', concert.id)
                .maybeSingle();

            if (data) {
                setAttendanceType(data.attendance_type as AttendanceType);
            }
        };
        checkSaved();
    }, [concert.id]);

    const handleSave = async (type: AttendanceType) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            toast.error('Inicia sesión para guardar conciertos');
            navigate('/auth');
            setSaveOpen(false);
            return;
        }

        setSaving(true);
        try {
            const userId = session.user.id;

            // If clicking same type, remove it
            if (attendanceType === type) {
                await supabase
                    .from('favorite_concerts')
                    .delete()
                    .eq('user_id', userId)
                    .eq('concert_id', concert.id);

                setAttendanceType(null);
                toast.success('Concierto removido de tu lista');
            } else {
                // Upsert attendance
                const { data: existing } = await supabase
                    .from('favorite_concerts')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('concert_id', concert.id)
                    .maybeSingle();

                if (existing) {
                    await supabase
                        .from('favorite_concerts')
                        .update({ attendance_type: type, is_favorite: true })
                        .eq('user_id', userId)
                        .eq('concert_id', concert.id);
                } else {
                    await supabase
                        .from('favorite_concerts')
                        .insert({
                            user_id: userId,
                            concert_id: concert.id,
                            is_favorite: true,
                            attendance_type: type,
                        });
                }

                setAttendanceType(type);
                toast.success(
                    type === 'attending' ? '¡Voy a asistir!' : 'Guardado como tentativo',
                    { icon: type === 'attending' ? '🎶' : '🤔' }
                );
            }
        } catch {
            toast.error('Error al guardar');
        } finally {
            setSaving(false);
            setSaveOpen(false);
        }
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();

        const shareUrl = `${window.location.origin}/concerts/${concert.slug || concert.id}`;
        const shareTitle = concert.title;
        const shareText = `${artistName} - ${concert.title} | ${location}`;

        // Mobile: use native share exclusively
        if (canShareNatively()) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
            } catch {
                // User cancelled — do nothing
            }
            return;
        }

        // Desktop: show popover with options
        setShareOpen(true);
    };

    const shareToNetwork = (network: string) => {
        const shareUrl = encodeURIComponent(`${window.location.origin}/concerts/${concert.slug || concert.id}`);
        const shareText = encodeURIComponent(`${artistName} - ${concert.title} | ${location}`);

        const urls: Record<string, string> = {
            whatsapp: `https://wa.me/?text=${shareText}%20${shareUrl}`,
            twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
            telegram: `https://t.me/share/url?url=${shareUrl}&text=${shareText}`,
        };

        if (urls[network]) {
            window.open(urls[network], '_blank', 'width=600,height=400');
        }

        setShareOpen(false);
    };

    const copyLink = async () => {
        const shareUrl = `${window.location.origin}/concerts/${concert.slug || concert.id}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Enlace copiado');
        setShareOpen(false);
    };

    const isSaved = attendanceType !== null;

    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full"
        >
            <Card
                className="group relative overflow-hidden rounded-[20px] border border-linea bg-superficie-2 aspect-[4/5] sm:aspect-[3/4] hover:border-[rgba(231,4,133,.35)] hover:shadow-[0_20px_50px_rgba(0,0,0,.5)] transition-all duration-300 cursor-pointer h-full"
                onClick={onClick}
            >
                {/* Póster full-bleed: la foto ocupa toda la card, sin corte */}
                <img
                    src={imageUrl}
                    alt={concert.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    onError={handleImageError}
                />
                {/* Overlay oscuro desde abajo para que el texto respire */}
                <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(180deg, transparent 35%, rgba(7,13,31,.92))' }}
                />

                {/* Chip de fecha: número grande en naranja, Big Shoulders */}
                <div className="absolute top-3 right-3 rounded-2xl border border-linea bg-noche/80 backdrop-blur-sm px-2.5 py-1.5 text-center min-w-[48px]">
                    <div className="font-display text-xl font-extrabold text-naranja leading-none">{day}</div>
                    <div className="font-fira text-[9px] uppercase tracking-[0.12em] text-texto-2 mt-0.5">{month}</div>
                </div>

                {/* Texto y acciones sobre la foto */}
                <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4 flex items-end justify-between gap-2.5">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <Music className="h-3 w-3 text-fucsia flex-shrink-0" />
                            <p className="font-fira text-[10px] sm:text-[11px] text-fucsia font-semibold uppercase tracking-[0.14em] truncate">
                                {artistName}
                            </p>
                        </div>

                        <h3 className="mt-1 text-sm sm:text-base font-bold text-texto line-clamp-2 leading-tight font-fira">
                            {/* Enlace real y crawleable al detalle; el resto de la tarjeta abre el quick view */}
                            <Link
                                to={`/concerts/${concert.slug || concert.id}`}
                                className="hover:text-fucsia transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {concert.title}
                            </Link>
                        </h3>

                        <div className="mt-1 flex items-center gap-1.5 text-texto-2">
                            <MapPin className="h-3.5 w-3.5 text-fucsia flex-shrink-0" />
                            <p className="text-xs sm:text-sm truncate">{location}</p>
                        </div>
                    </div>

                    {/* Action Buttons — esquina opuesta al texto */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                        {/* Save/Bookmark Button */}
                        <Popover open={saveOpen} onOpenChange={setSaveOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={isSaved ? "default" : "outline"}
                                    size="icon"
                                    className={`h-9 w-9 rounded-full transition-colors ${isSaved ? 'border-0 bg-[linear-gradient(95deg,#7516E2,#E70485)] text-white' : 'border-linea bg-noche/70 backdrop-blur-sm text-texto hover:bg-superficie-2 hover:text-texto'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-56 p-2"
                                align="start"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground px-2 pb-1">Guardar concierto</p>
                                    <Button
                                        variant={attendanceType === 'attending' ? 'default' : 'ghost'}
                                        className="w-full justify-start gap-2 h-9"
                                        onClick={() => handleSave('attending')}
                                        disabled={saving}
                                    >
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                                        Voy a asistir
                                    </Button>
                                    <Button
                                        variant={attendanceType === 'tentative' ? 'default' : 'ghost'}
                                        className="w-full justify-start gap-2 h-9"
                                        onClick={() => handleSave('tentative')}
                                        disabled={saving}
                                    >
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
                                        Tentativo
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Share Button */}
                        <Popover open={shareOpen} onOpenChange={setShareOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 rounded-full border-linea bg-noche/70 backdrop-blur-sm text-texto hover:bg-superficie-2 hover:text-texto transition-colors"
                                    onClick={handleShare}
                                >
                                    <Share2 className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-52 p-2"
                                align="start"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground px-2 pb-1">Compartir en</p>
                                    <Button variant="ghost" className="w-full justify-start gap-2 h-9" onClick={() => shareToNetwork('whatsapp')}>
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                        WhatsApp
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start gap-2 h-9" onClick={() => shareToNetwork('twitter')}>
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                        X (Twitter)
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start gap-2 h-9" onClick={() => shareToNetwork('facebook')}>
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                        Facebook
                                    </Button>
                                    <Button variant="ghost" className="w-full justify-start gap-2 h-9" onClick={() => shareToNetwork('telegram')}>
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                                        Telegram
                                    </Button>
                                    <div className="border-t border-border my-1" />
                                    <Button variant="ghost" className="w-full justify-start gap-2 h-9" onClick={copyLink}>
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                                        Copiar enlace
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};
