import { useMemo } from 'react';
import type { ConcertPageItem } from '@/hooks/queries/useConcertsPage';
import { getDefaultImage as getDefaultImageUtil } from '@/lib/imageOptimization';

const SITE_URL = 'https://www.conciertoslatam.app';
const getDefaultImage = () => getDefaultImageUtil('concert');

interface UseConcertsSEOOptions {
  selectedCityName: string | null;
  selectedCountryName: string | null;
  filterStatus: 'all' | 'upcoming' | 'past';
  debouncedSearchTerm: string;
  totalCount: number;
  concerts: ConcertPageItem[];
  selectedCountry: string;
  selectedCity: string;
}

export function useConcertsSEO({
  selectedCityName,
  selectedCountryName,
  filterStatus,
  debouncedSearchTerm,
  totalCount,
  concerts,
  selectedCountry,
  selectedCity,
}: UseConcertsSEOOptions) {
  // Dynamic SEO title and description based on filters
  const seoData = useMemo(() => {
    let title = 'Conciertos en América Latina 2026';
    let description = 'Encuentra todos los conciertos y eventos musicales en América Latina. ';
    let keywords = 'conciertos, conciertos 2026, eventos musicales, shows en vivo, entradas, boletas, tickets, ';

    if (selectedCityName) {
      title = `Conciertos en ${selectedCityName} 2026`;
      description = `Descubre todos los conciertos y eventos musicales en ${selectedCityName}. `;
      keywords += `conciertos en ${selectedCityName}, eventos en ${selectedCityName}, shows en ${selectedCityName}, `;
    } else if (selectedCountryName) {
      title = `Conciertos en ${selectedCountryName} 2026`;
      description = `Calendario completo de conciertos y festivales en ${selectedCountryName}. `;
      keywords += `conciertos en ${selectedCountryName}, eventos en ${selectedCountryName}, festivales en ${selectedCountryName}, `;
    }

    if (filterStatus === 'upcoming') {
      title = `Próximos ${title}`;
      description += 'Próximos conciertos, fechas, lugares, precios de entradas y toda la información que necesitas. ';
    } else if (filterStatus === 'past') {
      title = `${title} - Historial`;
      description += 'Historial de conciertos pasados, setlists y fotos. ';
    }

    if (debouncedSearchTerm) {
      title = `${debouncedSearchTerm} - Conciertos`;
      description = `Resultados de búsqueda para "${debouncedSearchTerm}". ${description}`;
      keywords += `${debouncedSearchTerm}, `;
    }

    description += `Conciertos Latam es la plataforma #1 de música en vivo en Latinoamérica con ${totalCount}+ eventos.`;
    keywords += 'Conciertos Latam, música en vivo, América Latina, Bogotá, Ciudad de México, Buenos Aires, Santiago, Lima, Movistar Arena, Estadio Nacional';

    return { title, description, keywords };
  }, [selectedCityName, selectedCountryName, filterStatus, debouncedSearchTerm, totalCount]);

  // Enhanced structured data for SEO - Event List
  const structuredData = useMemo(() => {
    const eventListData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": seoData.title,
      "description": seoData.description,
      "url": `${SITE_URL}/concerts`,
      "numberOfItems": totalCount,
      "itemListElement": concerts.slice(0, 10).map((concert, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "MusicEvent",
          "@id": `${SITE_URL}/concerts?id=${concert.slug}`,
          "name": concert.title,
          "description": concert.description || `Concierto de ${concert.artists?.name || 'artista'} en ${concert.venues?.cities?.name || 'América Latina'}`,
          "image": concert.image_url || concert.artist_image_url || getDefaultImage(),
          "startDate": concert.date || undefined,
          "eventStatus": "https://schema.org/EventScheduled",
          "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
          "location": {
            "@type": "Place",
            "name": concert.venues?.name || "Venue por confirmar",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": concert.venues?.cities?.name || "",
              "addressCountry": concert.venues?.cities?.countries?.name || ""
            }
          },
          "performer": concert.artists?.name ? {
            "@type": "MusicGroup",
            "name": concert.artists.name
          } : undefined,
          "organizer": {
            "@type": "Organization",
            "name": "Conciertos Latam",
            "url": SITE_URL
          },
          "offers": concert.ticket_url ? {
            "@type": "Offer",
            "url": concert.ticket_url,
            "availability": "https://schema.org/InStock",
            "priceCurrency": "USD"
          } : undefined
        }
      }))
    };

    // Organization data for branding
    const organizationData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Conciertos Latam",
      "url": SITE_URL,
      "logo": `${SITE_URL}/logo-principal.png`,
      "description": "La plataforma #1 de conciertos y eventos musicales en América Latina",
      "sameAs": [
        "https://www.instagram.com/conciertoslatam",
        "https://www.twitter.com/conciertoslatam",
        "https://www.facebook.com/conciertoslatam"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["Spanish", "English"]
      }
    };

    // Website search action for Google Sitelinks
    const websiteData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Conciertos Latam",
      "url": SITE_URL,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${SITE_URL}/concerts?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    };

    // FAQ Schema for common questions
    const faqData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "¿Dónde puedo encontrar todos los conciertos en América Latina?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "En Conciertos Latam encuentras el calendario más completo de conciertos, festivales y eventos musicales en toda América Latina. Tenemos información de eventos en México, Colombia, Argentina, Chile, Perú y más países."
          }
        },
        {
          "@type": "Question",
          "name": "¿Cómo comprar entradas para conciertos?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "En cada concierto listado en Conciertos Latam encontrarás un enlace directo a la venta oficial de entradas. Te conectamos con los proveedores autorizados como Ticketmaster, TuBoleta, Passline y más."
          }
        },
        {
          "@type": "Question",
          "name": "¿Qué información encuentro sobre cada concierto?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Para cada concierto ofrecemos: fecha y hora, ubicación del venue, artistas confirmados, precios de entradas, setlist (lista de canciones), comunidad de fans y más información relevante."
          }
        }
      ]
    };

    return [eventListData, organizationData, websiteData, faqData];
  }, [concerts, totalCount, seoData]);

  // Breadcrumb structured data
  const breadcrumbData = useMemo(() => {
    const items = [
      { name: "Inicio", item: SITE_URL },
      { name: "Conciertos", item: `${SITE_URL}/concerts` }
    ];

    if (selectedCountryName) {
      items.push({
        name: `Conciertos en ${selectedCountryName}`,
        item: `${SITE_URL}/concerts?country=${selectedCountry}`
      });
    }

    if (selectedCityName) {
      items.push({
        name: `Conciertos en ${selectedCityName}`,
        item: `${SITE_URL}/concerts?city=${selectedCity}`
      });
    }

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.item
      }))
    };
  }, [selectedCountryName, selectedCityName, selectedCountry, selectedCity]);

  return { seoData, structuredData, breadcrumbData };
}
