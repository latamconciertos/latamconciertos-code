import { useState, useEffect } from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Instagram, Music2, Heart, X } from 'lucide-react';
import { SocialImageGenerator } from '@/services/socialImageGenerator';
import {
    shareToInstagramStories,
    shareToTikTok,
    openInstagramProfile,
    trackShareEvent,
} from '@/utils/socialShare';
import { useToast } from '@/hooks/use-toast';

interface PostDownloadSharePromptProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fanProject: {
        id: string;
        name: string;
        concert: {
            artist_name: string;
            artist_image_url: string | null;
            date: string;
            venue_name: string;
        };
    };
    sequenceCount: number;
    gradientColors?: string[];
}

export const PostDownloadSharePrompt = ({
    open,
    onOpenChange,
    fanProject,
    sequenceCount,
    gradientColors = [],
}: PostDownloadSharePromptProps) => {
    const [imageBlob, setImageBlob] = useState<Blob | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (open && !imageBlob) {
            generateImage();
        }

        // Track that prompt was shown
        if (open) {
            trackShareEvent('share_prompt_shown', {
                fan_project_id: fanProject.id,
                artist_name: fanProject.concert.artist_name,
            });
        }
    }, [open]);

    const generateImage = async () => {
        setIsGenerating(true);
        try {
            const blob = await SocialImageGenerator.generateStoryImage({
                artistName: fanProject.concert.artist_name,
                artistImageUrl: fanProject.concert.artist_image_url || '',
                concertDate: fanProject.concert.date,
                venueName: fanProject.concert.venue_name,
                gradientColors,
            });

            setImageBlob(blob);
            setImagePreviewUrl(URL.createObjectURL(blob));
        } catch (error) {
            console.error('Error generating image:', error);
            toast({
                title: 'Error',
                description: 'No se pudo generar la imagen',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleShareInstagram = async () => {
        if (!imageBlob) return;

        trackShareEvent('share_instagram_clicked', {
            fan_project_id: fanProject.id,
        });

        try {
            await shareToInstagramStories(imageBlob);
        } catch (error) {
            console.error('Error sharing to Instagram:', error);
            toast({
                title: 'Imagen lista',
                description: 'Comparte la imagen descargada en tus stories',
            });
        }
    };

    const handleShareTikTok = async () => {
        if (!imageBlob) return;

        trackShareEvent('share_tiktok_clicked', {
            fan_project_id: fanProject.id,
        });

        try {
            await shareToTikTok(imageBlob);
        } catch (error) {
            console.error('Error sharing to TikTok:', error);
            toast({
                title: 'Imagen lista',
                description: 'Comparte la imagen descargada en TikTok',
            });
        }
    };

    const handleFollowInstagram = () => {
        trackShareEvent('follow_instagram_clicked', {
            fan_project_id: fanProject.id,
        });

        openInstagramProfile();
    };

    const handleDismiss = () => {
        trackShareEvent('share_prompt_dismissed', {
            fan_project_id: fanProject.id,
        });

        onOpenChange(false);
    };

    // Cleanup preview URL
    useEffect(() => {
        return () => {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-sm mx-auto p-0 overflow-hidden">
                <div className="relative bg-background">
                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    {/* Header */}
                    <div className="p-6 pb-4 text-center">
                        <div className="flex justify-center mb-3">
                            <Sparkles className="h-8 w-8 text-yellow-500" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">
                            ¡Comparte tu emoción!
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {sequenceCount} {sequenceCount === 1 ? 'canción lista' : 'canciones listas'} para {fanProject.concert.artist_name}
                        </p>
                    </div>

                    {/* Image Preview */}
                    <div className="px-6 pb-4">
                        <div className="relative aspect-[9/16] bg-muted rounded-2xl overflow-hidden border max-h-[45vh] mx-auto max-w-[280px]">
                            {isGenerating ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
                                </div>
                            ) : imagePreviewUrl ? (
                                <img
                                    src={imagePreviewUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : null}
                        </div>
                    </div>

                    {/* Share Section */}
                    <div className="px-6 pb-4">
                        <p className="text-xs text-center text-muted-foreground mb-4">
                            Comparte en tus stories
                        </p>

                        {/* Social Buttons - Horizontal */}
                        <div className="flex justify-center gap-4 mb-4">
                            {/* Instagram Button */}
                            <button
                                onClick={handleShareInstagram}
                                disabled={!imageBlob || isGenerating}
                                className="flex flex-col items-center gap-2 group disabled:opacity-50"
                            >
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                    <Instagram className="h-8 w-8 text-white" />
                                </div>
                                <span className="text-xs font-medium">Instagram</span>
                            </button>

                            {/* TikTok Button */}
                            <button
                                onClick={handleShareTikTok}
                                disabled={!imageBlob || isGenerating}
                                className="flex flex-col items-center gap-2 group disabled:opacity-50"
                            >
                                <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" fill="#00f2ea" />
                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" fill="#ff004f" />
                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" fill="white" />
                                    </svg>
                                </div>
                                <span className="text-xs font-medium">TikTok</span>
                            </button>
                        </div>
                    </div>

                    {/* Follow Section */}
                    <div className="px-6 pb-4 border-t pt-4">
                        <button
                            onClick={handleFollowInstagram}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg hover:bg-muted transition-colors"
                        >
                            <Heart className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium">Síguenos en @conciertos.latam</span>
                        </button>
                    </div>

                    {/* Dismiss Button */}
                    <div className="px-6 pb-6">
                        <button
                            onClick={handleDismiss}
                            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                        >
                            Ahora no
                        </button>
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
};
