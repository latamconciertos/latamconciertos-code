import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { User, MapPin, Calendar, Save, Sparkles } from 'lucide-react';
import type { Country, City } from '@/hooks/queries/useProfile';

interface ProfileFormData {
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    country_id: string | null;
    city_id: string | null;
    birth_date: string | null;
}

interface ProfileCompletionDialogProps {
    open: boolean;
    initialProfile: ProfileFormData;
    countries: Country[];
    cities: City[];
    onSave: (profile: ProfileFormData) => Promise<void>;
    isSaving: boolean;
}

const ProfileCompletionDialog = ({
    open,
    initialProfile,
    countries,
    cities,
    onSave,
    isSaving,
}: ProfileCompletionDialogProps) => {
    const [localProfile, setLocalProfile] = useState<ProfileFormData>(initialProfile);

    // Validar que los campos requeridos estén completos
    const isFormValid = localProfile.first_name && localProfile.last_name && localProfile.username;

    const handleSave = async () => {
        if (!isFormValid) return;
        await onSave(localProfile);
    };

    return (
        <Dialog open={open} modal>
            <DialogContent
                className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader className="text-left pb-4">
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <Sparkles className="h-6 w-6 text-primary" />
                        ¡Bienvenido a LATAM Conciertos!
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Completa tu perfil para personalizar tu experiencia y conectar con otros fanáticos
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Información Personal */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            Información Personal
                            <span className="text-xs text-muted-foreground font-normal">(Requerido)</span>
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="first_name" className="text-sm font-medium">
                                    Nombre <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="first_name"
                                    value={localProfile.first_name || ''}
                                    onChange={(e) => setLocalProfile({ ...localProfile, first_name: e.target.value })}
                                    placeholder="Tu nombre"
                                    className="h-11"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name" className="text-sm font-medium">
                                    Apellido <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="last_name"
                                    value={localProfile.last_name || ''}
                                    onChange={(e) => setLocalProfile({ ...localProfile, last_name: e.target.value })}
                                    placeholder="Tu apellido"
                                    className="h-11"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-sm font-medium">
                                Usuario <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="username"
                                value={localProfile.username || ''}
                                onChange={(e) => setLocalProfile({ ...localProfile, username: e.target.value })}
                                placeholder="nombre_usuario"
                                className="h-11"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="birth_date" className="text-sm font-medium flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                Fecha de nacimiento
                                <span className="text-xs text-muted-foreground font-normal">(Opcional)</span>
                            </Label>
                            <Input
                                id="birth_date"
                                type="date"
                                value={localProfile.birth_date || ''}
                                onChange={(e) => setLocalProfile({ ...localProfile, birth_date: e.target.value })}
                                className="h-11"
                            />
                        </div>
                    </div>

                    {/* Ubicación */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            Ubicación
                            <span className="text-xs text-muted-foreground font-normal">(Opcional)</span>
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">País</Label>
                                <Select
                                    value={localProfile.country_id || ''}
                                    onValueChange={(value) => {
                                        setLocalProfile({ ...localProfile, country_id: value, city_id: null });
                                    }}
                                >
                                    <SelectTrigger className="h-11">
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

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Ciudad</Label>
                                <Select
                                    value={localProfile.city_id || ''}
                                    onValueChange={(value) => setLocalProfile({ ...localProfile, city_id: value })}
                                    disabled={!localProfile.country_id || cities.length === 0}
                                >
                                    <SelectTrigger className="h-11">
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

                {/* Save Button */}
                <div className="pt-4 border-t">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !isFormValid}
                        className="w-full h-12 gap-2 text-base font-semibold"
                    >
                        <Save className="h-5 w-5" />
                        {isSaving ? 'Guardando...' : 'Completar Perfil'}
                    </Button>
                    {!isFormValid && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                            * Los campos marcados son obligatorios
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileCompletionDialog;
