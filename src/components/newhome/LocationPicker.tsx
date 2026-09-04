import { MapPin, Check, ChevronDown } from 'lucide-react';
import { useCountries } from '@/hooks/queries';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PreferredLocation, LocationSource } from '@/hooks/useUserLocation';

interface LocationPickerProps {
    countryId: string | null;
    countryName: string | null;
    source: LocationSource;
    onChange: (location: PreferredLocation | null) => void;
}

/**
 * Selector de ubicación de la agenda. La detección automática acierta la mayoría de las veces,
 * pero VPNs, viajes y errores de geolocalización existen: sin una salida manual el usuario
 * queda atrapado viendo la cartelera de otro país.
 */
export const LocationPicker = ({ countryId, countryName, source, onChange }: LocationPickerProps) => {
    const { data: countries = [] } = useCountries();

    const label = countryName ?? 'Toda Latinoamérica';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="group inline-flex items-center gap-1.5 rounded-full border border-linea bg-superficie-2/60 px-3 py-1.5 text-xs font-medium text-texto-2 transition-colors hover:border-fucsia/40 hover:text-texto">
                <MapPin className="h-3.5 w-3.5 text-fucsia" />
                <span>{label}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform group-data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 w-56 overflow-y-auto">
                <DropdownMenuLabel className="text-xs font-normal text-texto-2">
                    {source === 'ip' && 'Detectamos tu ubicación'}
                    {source === 'profile' && 'Según tu perfil'}
                    {source === 'manual' && 'Tu elección'}
                    {source === 'none' && 'Elige una ubicación'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onSelect={() => onChange({ countryId: null, countryName: null })}
                    className="flex items-center justify-between text-sm"
                >
                    Toda Latinoamérica
                    {!countryId && <Check className="h-4 w-4 text-fucsia" />}
                </DropdownMenuItem>
                {countries.map((country) => (
                    <DropdownMenuItem
                        key={country.id}
                        onSelect={() => onChange({ countryId: country.id, countryName: country.name })}
                        className="flex items-center justify-between text-sm"
                    >
                        {country.name}
                        {countryId === country.id && <Check className="h-4 w-4 text-fucsia" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
