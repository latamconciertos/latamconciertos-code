import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { User, MapPin, Calendar, Save, Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Country, City } from '@/hooks/queries/useProfile';

interface ProfileFormData {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  country_id: string | null;
  city_id: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface ProfileEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  localProfile: ProfileFormData;
  setLocalProfile: (profile: ProfileFormData) => void;
  countries: Country[];
  cities: City[];
  onSave: () => void;
  isSaving: boolean;
}

const ProfileEditSheet = ({
  open,
  onOpenChange,
  localProfile,
  setLocalProfile,
  countries,
  cities,
  onSave,
  isSaving,
}: ProfileEditSheetProps) => {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setLocalProfile({ ...localProfile, avatar_url: publicUrl });
      toast.success('Foto actualizada');
    } catch (error: any) {
      toast.error(error.message || 'Error al subir la imagen');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Editar perfil
          </SheetTitle>
          <SheetDescription>
            Actualiza tu información personal y ubicación
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto h-[calc(85vh-10rem)] pb-20">
          {/* Avatar Upload */}
          <div className="flex justify-center">
            <button
              type="button"
              className="relative group"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 via-primary/30 to-primary/50 flex items-center justify-center ring-[3px] ring-primary/30 overflow-hidden">
                {localProfile.avatar_url ? (
                  <img src={localProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-primary" />
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingAvatar ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 bg-primary rounded-full p-1.5 shadow-md">
                <Camera className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Información Personal
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="first_name" className="text-xs">Nombre</Label>
                <Input
                  id="first_name"
                  value={localProfile.first_name || ''}
                  onChange={(e) => setLocalProfile({ ...localProfile, first_name: e.target.value })}
                  placeholder="Tu nombre"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name" className="text-xs">Apellido</Label>
                <Input
                  id="last_name"
                  value={localProfile.last_name || ''}
                  onChange={(e) => setLocalProfile({ ...localProfile, last_name: e.target.value })}
                  placeholder="Tu apellido"
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs text-muted-foreground">Usuario</Label>
              <Input
                id="username"
                value={localProfile.username || ''}
                readOnly
                disabled
                className="h-10 bg-muted/50 cursor-not-allowed"
              />
              <p className="text-[11px] text-muted-foreground">El nombre de usuario no se puede cambiar</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs">Bio</Label>
              <Textarea
                id="bio"
                value={localProfile.bio || ''}
                onChange={(e) => setLocalProfile({ ...localProfile, bio: e.target.value.slice(0, 150) })}
                placeholder="Cuéntanos sobre tus gustos musicales..."
                className="resize-none h-20"
                maxLength={150}
              />
              <p className="text-[11px] text-muted-foreground text-right">
                {(localProfile.bio || '').length}/150
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="birth_date" className="text-xs flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Fecha de nacimiento
              </Label>
              <Input
                id="birth_date"
                type="date"
                value={localProfile.birth_date || ''}
                onChange={(e) => setLocalProfile({ ...localProfile, birth_date: e.target.value })}
                className="h-10"
              />
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Ubicación
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">País</Label>
                <Select
                  value={localProfile.country_id || ''}
                  onValueChange={(value) => {
                    setLocalProfile({ ...localProfile, country_id: value, city_id: null });
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Ciudad</Label>
                <Select
                  value={localProfile.city_id || ''}
                  onValueChange={(value) => setLocalProfile({ ...localProfile, city_id: value })}
                  disabled={!localProfile.country_id || cities.length === 0}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Save Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="w-full h-12 gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProfileEditSheet;
