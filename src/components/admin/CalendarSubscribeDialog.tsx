import { useEffect, useState } from 'react';
import { CalendarPlus, Copy, Check, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FeedInfo {
  url: string;
  webcalUrl: string;
}

export function CalendarSubscribeDialog() {
  const [open, setOpen] = useState(false);
  const [feed, setFeed] = useState<FeedInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || feed) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('calendar-token');
        if (error) throw error;
        if (!cancelled) setFeed(data as FeedInfo);
      } catch (e) {
        toast.error('No pudimos generar tu URL del calendario');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, feed]);

  const handleCopy = async () => {
    if (!feed) return;
    try {
      await navigator.clipboard.writeText(feed.url);
      setCopied(true);
      toast.success('URL copiada al portapapeles');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <CalendarPlus className="h-3.5 w-3.5" />
          <span className="text-[11px] font-bold uppercase tracking-[0.15em]">Suscribir</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
            Calendario
          </p>
          <DialogTitle className="font-display uppercase text-2xl md:text-3xl font-black tracking-tight leading-[0.95]">
            Suscribir al calendario
          </DialogTitle>
          <DialogDescription className="pt-2">
            Conectá los deadlines de acreditaciones al calendario de tu celular.
            Recibirás alertas nativas 7, 3 y 1 día antes de cada deadline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Feed URL */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Tu URL personal de suscripción
            </label>
            <div className="flex gap-2">
              <Input
                value={loading ? 'Generando...' : feed?.url ?? ''}
                readOnly
                className="font-mono text-xs"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                disabled={!feed || loading}
                aria-label="Copiar URL"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Esta URL es privada — guardala como guardarías una contraseña.
            </p>
          </div>

          {/* Quick subscribe buttons */}
          {feed && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-9"
                onClick={() => window.open(feed.webcalUrl, '_blank')}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="text-xs">iOS / Apple Calendar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-9"
                onClick={() =>
                  window.open(
                    `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(feed.url)}`,
                    '_blank'
                  )
                }
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="text-xs">Google Calendar</span>
              </Button>
            </div>
          )}

          {/* Instructions */}
          <details className="group rounded-lg border border-border/60 bg-muted/30">
            <summary className="cursor-pointer px-4 py-3 text-xs font-semibold flex items-center justify-between">
              <span>Instrucciones manuales por plataforma</span>
              <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="px-4 pb-4 space-y-4 text-xs text-muted-foreground">
              <div>
                <p className="font-bold text-foreground uppercase tracking-[0.15em] text-[10px] mb-1.5">
                  iPhone / iPad
                </p>
                <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                  <li>Tocá el botón <strong>iOS / Apple Calendar</strong> arriba — Apple Calendar abrirá la URL automáticamente</li>
                  <li>Confirmá <strong>"Suscribir"</strong> y elegí cada cuánto refrescar (recomendado: cada hora)</li>
                </ol>
              </div>
              <div>
                <p className="font-bold text-foreground uppercase tracking-[0.15em] text-[10px] mb-1.5">
                  Android (Google Calendar)
                </p>
                <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                  <li>Tocá <strong>Google Calendar</strong> arriba — abrirá calendar.google.com con la URL</li>
                  <li>Aceptá la suscripción. El calendario aparecerá en tu app de Google Calendar del celular</li>
                </ol>
              </div>
              <div>
                <p className="font-bold text-foreground uppercase tracking-[0.15em] text-[10px] mb-1.5">
                  Outlook / otros
                </p>
                <p>
                  Copiá la URL y agregala como "Calendario suscrito por internet" o "Subscribe to a calendar from URL".
                </p>
              </div>
            </div>
          </details>

          {/* Refresh note */}
          <div className="text-[11px] text-muted-foreground bg-muted/40 rounded-md p-3 leading-relaxed">
            <strong className="text-foreground">Nota:</strong> Apple Calendar refresca cada ~hora,
            Google Calendar cada ~24 horas. Si cambiás un deadline, puede tardar un poco en reflejarse en el celular.
            Las alertas (7d, 3d, 1d antes) están incluidas en el feed y se disparan en tu celular sin internet.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
