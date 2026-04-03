export interface CountryOption {
  code: string;
  name: string;
  market: string;
  flag: string;
}

export interface ChartTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  external_urls: {
    spotify: string;
  };
  duration_ms: number;
  position: number;
  preview_url?: string;
  popularity?: number;
}

export interface ChartArtist {
  id: string;
  name: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  position: number;
  popularity: number;
  genres?: string[];
  external_urls: {
    spotify: string;
  };
}

export const LATIN_AMERICAN_COUNTRIES: CountryOption[] = [
  { code: 'CO', name: 'Colombia', market: 'CO', flag: '🇨🇴' },
  { code: 'MX', name: 'México', market: 'MX', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', market: 'AR', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', market: 'CL', flag: '🇨🇱' },
  { code: 'PE', name: 'Perú', market: 'PE', flag: '🇵🇪' },
  { code: 'BR', name: 'Brasil', market: 'BR', flag: '🇧🇷' },
  { code: 'EC', name: 'Ecuador', market: 'EC', flag: '🇪🇨' },
  { code: 'UY', name: 'Uruguay', market: 'UY', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguay', market: 'PY', flag: '🇵🇾' },
  { code: 'BO', name: 'Bolivia', market: 'BO', flag: '🇧🇴' },
  { code: 'VE', name: 'Venezuela', market: 'VE', flag: '🇻🇪' },
  { code: 'CR', name: 'Costa Rica', market: 'CR', flag: '🇨🇷' },
  { code: 'PA', name: 'Panamá', market: 'PA', flag: '🇵🇦' },
  { code: 'DO', name: 'República Dominicana', market: 'DO', flag: '🇩🇴' },
  { code: 'PR', name: 'Puerto Rico', market: 'PR', flag: '🇵🇷' },
];
