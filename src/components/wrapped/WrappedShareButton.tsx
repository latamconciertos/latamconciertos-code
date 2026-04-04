import { useRef, useState, useCallback } from 'react';
import { Share2, Download, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { canShareNatively } from '@/utils/socialShare';
import type { WrappedData } from '@/types/wrapped';
import WrappedShareCard from './WrappedShareCard';

interface WrappedShareButtonProps {
  data: WrappedData;
}

const WrappedShareButton = ({ data }: WrappedShareButtonProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPopover, setShowPopover] = useState(false);

  const captureCard = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 1,
        useCORS: true,
        backgroundColor: null,
        width: 1080,
        height: 1080,
      });

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    } catch {
      return null;
    }
  }, []);

  const handleShare = async () => {
    setIsCapturing(true);
    try {
      const blob = await captureCard();
      if (!blob) return;

      if (canShareNatively()) {
        const file = new File([blob], 'mi-wrapped-conciertos.png', { type: 'image/png' });
        try {
          await navigator.share({
            files: [file],
            title: `Mi ${data.year} en Conciertos`,
            text: `Fui a ${data.totalConcerts} conciertos este ano. Descubre tu Wrapped en conciertoslatam.app/wrapped`,
          });
          return;
        } catch {
          // User cancelled or share failed, fall through to popover
        }
      }

      setShowPopover(true);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownload = async () => {
    setIsCapturing(true);
    try {
      const blob = await captureCard();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wrapped-${data.year}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText('https://conciertoslatam.app/wrapped');
    } catch {
      // Silently ignore
    }
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(
      `Fui a ${data.totalConcerts} conciertos en ${data.year}! Descubre tu Wrapped: conciertoslatam.app/wrapped`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToX = () => {
    const text = encodeURIComponent(
      `Fui a ${data.totalConcerts} conciertos en ${data.year}! #ConciertosLatam #Wrapped`
    );
    window.open(`https://x.com/intent/tweet?text=${text}&url=${encodeURIComponent('https://conciertoslatam.app/wrapped')}`, '_blank');
  };

  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://conciertoslatam.app/wrapped')}`,
      '_blank'
    );
  };

  return (
    <>
      <WrappedShareCard ref={cardRef} data={data} />

      <Popover open={showPopover} onOpenChange={setShowPopover}>
        <PopoverTrigger asChild>
          <Button
            size="lg"
            onClick={handleShare}
            disabled={isCapturing}
            className="bg-white text-indigo-900 hover:bg-white/90 font-bold px-8 py-3 text-base rounded-full"
          >
            <Share2 className="mr-2 h-5 w-5" />
            {isCapturing ? 'Generando...' : 'Compartir mi Wrapped'}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 border-white/10 bg-gray-900/95 backdrop-blur p-2"
          align="center"
          side="top"
        >
          <div className="flex flex-col gap-1">
            <button
              onClick={shareToWhatsApp}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
            >
              <span className="text-lg">💬</span> WhatsApp
            </button>
            <button
              onClick={shareToX}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
            >
              <span className="text-lg">𝕏</span> X (Twitter)
            </button>
            <button
              onClick={shareToFacebook}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
            >
              <span className="text-lg">📘</span> Facebook
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
            >
              <Download className="h-4 w-4" /> Descargar imagen
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white hover:bg-white/10 transition-colors"
            >
              <Link2 className="h-4 w-4" /> Copiar enlace
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default WrappedShareButton;
