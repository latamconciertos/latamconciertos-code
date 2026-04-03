import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, Download, RefreshCw, CheckCircle, AlertCircle, Upload, Image as ImageIcon, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PWASettings {
  id: string;
  app_name: string;
  short_name: string;
  description: string;
  theme_color: string;
  background_color: string;
  icon_192_url: string | null;
  icon_512_url: string | null;
}

export function PWAAdmin() {
  const [isPWA, setIsPWA] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [settings, setSettings] = useState<PWASettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if running as PWA
    const isInPWA = window.matchMedia('(display-mode: standalone)').matches;
    setIsPWA(isInPWA);

    // Check if service worker is registered
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        setIsInstalled(true);
      });
    }

    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('pwa_settings')
        .select('*')
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error loading PWA settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (registration) {
      await registration.update();
      toast({
        title: "Actualización iniciada",
        description: "La PWA se actualizará en segundo plano",
      });
    }
  };

  const handleInstallPrompt = () => {
    toast({
      title: "Instalación de PWA",
      description: "Para instalar, abre el menú de tu navegador y selecciona 'Instalar aplicación' o 'Agregar a pantalla de inicio'",
    });
  };

  const handleIconUpload = async (event: React.ChangeEvent<HTMLInputElement>, size: 192 | 512) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona una imagen válida",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no debe superar 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `pwa-icon-${size}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('pwa-icons')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pwa-icons')
        .getPublicUrl(filePath);

      // Update settings
      const updateField = size === 192 ? 'icon_192_url' : 'icon_512_url';
      const { error: updateError } = await supabase
        .from('pwa_settings')
        .update({ [updateField]: publicUrl })
        .eq('id', settings?.id);

      if (updateError) throw updateError;

      await loadSettings();

      toast({
        title: "Ícono subido",
        description: `El ícono de ${size}x${size}px se subió correctamente`,
      });
    } catch (error) {
      console.error('Error uploading icon:', error);
      toast({
        title: "Error",
        description: "No se pudo subir el ícono",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const { error } = await supabase
        .from('pwa_settings')
        .update({
          app_name: formData.get('app_name') as string,
          short_name: formData.get('short_name') as string,
          description: formData.get('description') as string,
          theme_color: formData.get('theme_color') as string,
          background_color: formData.get('background_color') as string,
        })
        .eq('id', settings?.id);

      if (error) throw error;

      await loadSettings();

      toast({
        title: "Configuración guardada",
        description: "Los cambios se guardaron correctamente",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    }
  };

  const copyManifestConfig = () => {
    const config = `manifest: {
  name: '${settings?.app_name}',
  short_name: '${settings?.short_name}',
  description: '${settings?.description}',
  theme_color: '${settings?.theme_color}',
  background_color: '${settings?.background_color}',
  display: 'standalone',
  start_url: '/',
  icons: [
    {
      src: '/pwa-icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/pwa-icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any'
    }
  ]
}`;

    navigator.clipboard.writeText(config);
    toast({
      title: "Copiado",
      description: "Configuración copiada al portapapeles",
    });
  };

  if (loading) {
    return <div className="p-6">Cargando configuración PWA...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuración PWA</h2>
        <p className="text-muted-foreground">
          Gestiona la aplicación web progresiva (Progressive Web App)
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Estado de PWA
          </CardTitle>
          <CardDescription>
            Estado actual de la instalación y funcionamiento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Service Worker</p>
                <p className="text-xs text-muted-foreground">Estado del worker</p>
              </div>
              {isInstalled ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Activo
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Inactivo
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Modo PWA</p>
                <p className="text-xs text-muted-foreground">Aplicación instalada</p>
              </div>
              {isPWA ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Sí
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  No
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Offline</p>
                <p className="text-xs text-muted-foreground">Caché disponible</p>
              </div>
              {isInstalled ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Habilitado
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Deshabilitado
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleUpdate} disabled={!isInstalled} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualizar PWA
            </Button>
            <Button onClick={handleInstallPrompt} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Instrucciones de Instalación
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Icons Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Gestión de Íconos PWA
          </CardTitle>
          <CardDescription>
            Sube y gestiona los íconos de la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Los íconos actuales se almacenan en <code className="bg-muted px-1 py-0.5 rounded">/public/</code>. 
              Al subir nuevos íconos aquí, se guardarán en Supabase Storage pero deberás actualizar <code className="bg-muted px-1 py-0.5 rounded">vite.config.ts</code> y hacer rebuild para que la PWA los use.
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 192x192 Icon */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Ícono 192x192px</h4>
                <p className="text-sm text-muted-foreground mb-4">Para pantallas estándar y Android</p>
              </div>

              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center justify-center h-48 mb-4">
                  {settings?.icon_192_url ? (
                    <img 
                      src={settings.icon_192_url} 
                      alt="PWA Icon 192x192" 
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <img src="/pwa-icon-192.png" alt="Current PWA Icon" className="max-h-full" />
                    </div>
                  )}
                </div>
                <Label htmlFor="icon-192" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 p-2 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">Subir nuevo ícono 192x192</span>
                  </div>
                  <Input
                    id="icon-192"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleIconUpload(e, 192)}
                    disabled={uploading}
                    className="hidden"
                  />
                </Label>
              </div>
            </div>

            {/* 512x512 Icon */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Ícono 512x512px</h4>
                <p className="text-sm text-muted-foreground mb-4">Para pantallas de alta resolución</p>
              </div>

              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center justify-center h-48 mb-4">
                  {settings?.icon_512_url ? (
                    <img 
                      src={settings.icon_512_url} 
                      alt="PWA Icon 512x512" 
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <img src="/pwa-icon-512.png" alt="Current PWA Icon" className="max-h-full" />
                    </div>
                  )}
                </div>
                <Label htmlFor="icon-512" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 p-2 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">Subir nuevo ícono 512x512</span>
                  </div>
                  <Input
                    id="icon-512"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleIconUpload(e, 512)}
                    disabled={uploading}
                    className="hidden"
                  />
                </Label>
              </div>
            </div>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Vista Previa iOS:</strong> En iPhone, el ícono se mostrará como un cuadrado con esquinas redondeadas. 
              En Android, el ícono puede aparecer circular o cuadrado según el launcher del dispositivo.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Manifest</CardTitle>
          <CardDescription>
            Personaliza la información de la PWA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="app_name">Nombre de la App</Label>
                <Input
                  id="app_name"
                  name="app_name"
                  defaultValue={settings?.app_name}
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="short_name">Nombre Corto</Label>
                <Input
                  id="short_name"
                  name="short_name"
                  defaultValue={settings?.short_name}
                  placeholder="Máx. 12 caracteres"
                  maxLength={12}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={settings?.description}
                  placeholder="Describe tu aplicación"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="theme_color">Color del Tema</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      defaultValue={settings?.theme_color}
                      onChange={(e) => {
                        const hexInput = document.getElementById('theme_color') as HTMLInputElement;
                        if (hexInput) hexInput.value = e.target.value;
                      }}
                      className="w-20 h-10"
                    />
                    <Input
                      id="theme_color"
                      name="theme_color"
                      defaultValue={settings?.theme_color}
                      placeholder="#1e3a8a"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="background_color">Color de Fondo</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      defaultValue={settings?.background_color}
                      onChange={(e) => {
                        const hexInput = document.getElementById('background_color') as HTMLInputElement;
                        if (hexInput) hexInput.value = e.target.value;
                      }}
                      className="w-20 h-10"
                    />
                    <Input
                      id="background_color"
                      name="background_color"
                      defaultValue={settings?.background_color}
                      placeholder="#0f172a"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                Guardar Configuración
              </Button>
              <Button type="button" variant="outline" onClick={copyManifestConfig} className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Copiar Config para vite.config.ts
              </Button>
            </div>
          </form>

          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="text-sm font-medium mb-2">📝 Pasos para aplicar cambios:</p>
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                <li>Guarda la configuración aquí</li>
                <li>Copia la configuración y pégala en <code className="bg-background px-1 py-0.5 rounded">vite.config.ts</code></li>
                <li>Haz rebuild de la aplicación</li>
                <li>Los usuarios verán los cambios al actualizar la PWA</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Features Card */}
      <Card>
        <CardHeader>
          <CardTitle>Características PWA Activas</CardTitle>
          <CardDescription>
            Funcionalidades habilitadas en tu PWA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Instalación</p>
                <p className="text-sm text-muted-foreground">Los usuarios pueden instalar la app en sus dispositivos</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Funcionalidad Offline</p>
                <p className="text-sm text-muted-foreground">Caché inteligente para acceso sin conexión</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Actualización Automática</p>
                <p className="text-sm text-muted-foreground">La app se actualiza automáticamente en segundo plano</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Pantalla Completa</p>
                <p className="text-sm text-muted-foreground">Experiencia de app nativa sin barra del navegador</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Optimización de Recursos</p>
                <p className="text-sm text-muted-foreground">Caché de fuentes y recursos estáticos</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Íconos Nativos</p>
                <p className="text-sm text-muted-foreground">Logo de Conciertos Latam como ícono de la app</p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}