import { useState, useEffect } from 'react';
import { UserPlus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import popupLogo from '@/assets/popup-logo.png';

const WelcomePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check authentication status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    // Check if popup was already shown today
    const lastShown = localStorage.getItem('welcomePopupLastShown');
    const today = new Date().toDateString();
    
    if (lastShown !== today) {
      // Show popup after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem('welcomePopupLastShown', today);
      }, 2000);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    }
  };

  // Don't render if user is authenticated and app is already installed
  if (isAuthenticated && (isStandalone || !isInstallable)) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="p-6 pt-8 text-center space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <img 
              src={popupLogo} 
              alt="Conciertos Latam" 
              className="mx-auto h-28 w-auto mb-4"
            />
            <h2 className="text-xl font-bold text-foreground">
              ¡Bienvenido a Conciertos Latam!
            </h2>
            <p className="text-sm text-muted-foreground">
              Tu guía para los mejores conciertos en Latinoamérica
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {!isAuthenticated && (
              <Button 
                className="w-full gap-2" 
                size="lg"
                asChild
                onClick={() => setIsOpen(false)}
              >
                <Link to="/auth">
                  <UserPlus className="h-4 w-4" />
                  Crear cuenta gratis
                </Link>
              </Button>
            )}

            {isInstallable && !isStandalone && (
              <Button 
                variant="outline" 
                className="w-full gap-2" 
                size="lg"
                onClick={handleInstallClick}
              >
                <Download className="h-4 w-4" />
                Instalar en tu teléfono
              </Button>
            )}

            {!isInstallable && !isStandalone && (
              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-2">
                  <Download className="h-3 w-3" />
                  Instala la app en tu teléfono
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>iPhone:</strong> Toca el ícono de compartir y selecciona "Agregar a pantalla de inicio"
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Android:</strong> Abre el menú del navegador y selecciona "Instalar app"
                </p>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="text-center">
              <div className="text-2xl mb-1">🎵</div>
              <p className="text-[10px] text-muted-foreground">Conciertos</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">📅</div>
              <p className="text-[10px] text-muted-foreground">Calendario</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🎤</div>
              <p className="text-[10px] text-muted-foreground">Setlists</p>
            </div>
          </div>

          {/* Skip */}
          <button 
            onClick={() => setIsOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Continuar sin registrarme
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePopup;
