import { useCallback, useEffect, useState } from 'react';
import { useUserCountry } from './queries';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'cl:preferred-location';

export interface PreferredLocation {
  countryId: string | null;
  countryName: string | null;
  cityName?: string | null;
}

export type LocationSource = 'manual' | 'profile' | 'ip' | 'none';

export interface UserLocation extends PreferredLocation {
  source: LocationSource;
  isLoading: boolean;
  setPreferred: (location: PreferredLocation | null) => void;
}

function readStored(): PreferredLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PreferredLocation) : null;
  } catch {
    return null; // localStorage bloqueado (modo privado): se sigue con la detección automática
  }
}

/**
 * Ubicación efectiva del usuario para personalizar la agenda, en orden de confianza:
 * elección manual > país del perfil (usuarios registrados) > geolocalización por IP.
 * La elección manual gana siempre: cubre VPNs, viajeros y detecciones erróneas.
 */
export function useUserLocation(): UserLocation {
  const { user } = useAuth();
  const [manual, setManual] = useState<PreferredLocation | null>(() => readStored());
  const [profileLocation, setProfileLocation] = useState<PreferredLocation | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);

  const { data: ipCountry, isLoading: ipLoading } = useUserCountry();

  useEffect(() => {
    let active = true;
    if (!user) {
      setProfileLocation(null);
      setProfileChecked(true);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('country_id, countries (id, name)')
        .eq('id', user.id)
        .maybeSingle();
      if (!active) return;
      const country = (data as { countries?: { id: string; name: string } | null })?.countries;
      setProfileLocation(country ? { countryId: country.id, countryName: country.name } : null);
      setProfileChecked(true);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const setPreferred = useCallback((location: PreferredLocation | null) => {
    setManual(location);
    try {
      if (location) localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* sin persistencia: la elección vale para esta sesión */
    }
  }, []);

  if (manual) {
    return { ...manual, source: 'manual', isLoading: false, setPreferred };
  }
  if (profileLocation) {
    return { ...profileLocation, source: 'profile', isLoading: false, setPreferred };
  }
  if (ipCountry) {
    return {
      countryId: ipCountry.id,
      countryName: ipCountry.name,
      cityName: (ipCountry as { city_name?: string | null }).city_name ?? null,
      source: 'ip',
      isLoading: false,
      setPreferred,
    };
  }
  return {
    countryId: null,
    countryName: null,
    cityName: null,
    source: 'none',
    isLoading: ipLoading || (Boolean(user) && !profileChecked),
    setPreferred,
  };
}
