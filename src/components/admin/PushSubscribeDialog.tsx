import { useEffect, useState } from 'react';
import { Bell, BellOff, Send, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ensurePushSupported,
  getCurrentSubscription,
  requestPermission,
  subscribe,
  unsubscribe,
  sendTestPush,
} from '@/lib/pushNotifications';
import { toast } from 'sonner';

export function PushSubscribeDialog({ trigger }: { trigger?: React.ReactNode } = {}) {
  const [open, setOpen] = useState(false);
  const [supported, setSupported] = useState<{ supported: boolean; reason?: string }>({
    supported: true,
  });
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const status = ensurePushSupported();
    setSupported(status);
    if (status.supported) {
      setPermission(typeof Notification !== 'undefined' ? Notification.permission : 'default');
      getCurrentSubscription()
        .then((s) => setSubscribed(!!s))
        .catch(() => setSubscribed(false));
    }
  }, [open]);

  const handleEnable = async () => {
    if (!supported.supported) return;
    setBusy(true);
    try {
      const perm = await requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        toast.error('Permiso denegado. Activalo desde la configuración del navegador.');
        return;
      }
      await subscribe();
      setSubscribed(true);
      toast.success('Notificaciones activadas');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudieron activar las notificaciones');
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    try {
      await unsubscribe();
      setSubscribed(false);
      toast.success('Notificaciones desactivadas');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudieron desactivar');
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setBusy(true);
    try {
      const result = await sendTestPush();
      if (result.ok && (result.sent ?? 0) > 0) {
        toast.success(`Push de prueba enviada (${result.sent} dispositivo${result.sent === 1 ? '' : 's'})`);
      } else if (result.ok && result.sent === 0) {
        toast.warning('Sin dispositivos suscritos. Activá primero las notificaciones.');
      } else {
        toast.error(result.error || 'No se pudo enviar la prueba');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Error al enviar prueba');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em]">Push</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
            Notificaciones
          </p>
          <DialogTitle className="font-display uppercase text-2xl md:text-3xl font-black tracking-tight leading-[0.95]">
            Push notifications
          </DialogTitle>
          <DialogDescription className="pt-2">
            Recibí alertas instantáneas en este dispositivo cuando algo importante pase con las acreditaciones (cambios de status, deadlines, comentarios).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {!supported.supported ? (
            <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground mb-1">No soportado</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {supported.reason}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Status row */}
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-4">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Estado en este dispositivo
                  </p>
                  <p className="font-fira text-base font-semibold">
                    {subscribed === null
                      ? 'Verificando…'
                      : subscribed
                        ? 'Activadas'
                        : permission === 'denied'
                          ? 'Bloqueadas en el navegador'
                          : 'Desactivadas'}
                  </p>
                </div>
                <div
                  className={
                    subscribed
                      ? 'h-2.5 w-2.5 rounded-full bg-emerald-500'
                      : 'h-2.5 w-2.5 rounded-full bg-muted-foreground/30'
                  }
                />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                {subscribed ? (
                  <Button
                    variant="outline"
                    onClick={handleDisable}
                    disabled={busy}
                    className="gap-1.5 h-9"
                  >
                    <BellOff className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold uppercase tracking-[0.15em]">Desactivar</span>
                  </Button>
                ) : (
                  <Button
                    onClick={handleEnable}
                    disabled={busy || permission === 'denied'}
                    className="gap-1.5 h-9"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold uppercase tracking-[0.15em]">
                      {permission === 'denied' ? 'Bloqueado' : 'Activar'}
                    </span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={handleTest}
                  disabled={busy || !subscribed}
                  className="gap-1.5 h-9"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold uppercase tracking-[0.15em]">Probar</span>
                </Button>
              </div>

              {permission === 'denied' && (
                <div className="text-[11px] text-muted-foreground bg-amber-500/10 border border-amber-500/20 rounded-md p-3 leading-relaxed">
                  Las notificaciones están bloqueadas para este sitio.
                  Activalas en la configuración del navegador (icono del candado en la barra de URL)
                  y recargá la página.
                </div>
              )}

              {/* iOS PWA hint */}
              <details className="group rounded-lg border border-border/60 bg-muted/30">
                <summary className="cursor-pointer px-4 py-3 text-xs font-semibold flex items-center justify-between">
                  <span>iPhone / iPad — pasos extra</span>
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="px-4 pb-4 space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <p>
                    Apple solo permite Web Push en iOS si la app está instalada como PWA en pantalla de inicio.
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>En Safari iOS, abrí esta misma página</li>
                    <li>Tocá el botón <strong>Compartir</strong> (cuadrado con flecha)</li>
                    <li>Bajá hasta <strong>Add to Home Screen</strong> / <strong>Añadir a inicio</strong></li>
                    <li>Abrí la app desde el icono nuevo en tu pantalla</li>
                    <li>Volvé a esta sección y tocá <strong>Activar</strong></li>
                  </ol>
                  <p className="pt-1">
                    Requiere iOS 16.4 o superior.
                  </p>
                </div>
              </details>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
