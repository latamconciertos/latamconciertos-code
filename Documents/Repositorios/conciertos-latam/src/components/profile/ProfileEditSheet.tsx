import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { User, MapPin, Calendar, Save } from 'lucide-react';
import type { Country, City } from '@/hooks/queries/useProfile';

interface ProfileFormData {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  country_id: string | null;
  city_id: string | null;
  birth_date: string | null;
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

        <div className="space-y-6 overflow-y-auto pb-20">
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
              <Label htmlFor="username" className="text-xs">Usuario</Label>
              <Input
                id="username"
                value={localProfile.username || ''}
                onChange={(e) => setLocalProfile({ ...localProfile, username: e.target.value })}
                placeholder="nombre_usuario"
                className="h-10"
              />
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
