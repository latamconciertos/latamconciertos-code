import { useMemo } from 'react';
import { getDefaultImage as getDefaultImageUtil } from '@/lib/imageOptimization';
import type { FestivalWithRelations } from '@/types/entities/festival';

const SITE_URL = 'https://www.conciertoslatam.app';
const getDefaultImage = () => getDefaultImageUtil('festival');

interface UseFestivalsSEOOptions {
  selectedCityName: string | null;
  selectedCountryName: string | null;
  filterStatus: 'all' | 'upcoming' | 'past';
  totalCount: number;
  filteredFestivals: FestivalWithRelations[];
}

export function useFestivalsSEO({
  selectedCityName,
  selectedCountryName,
  filterStatus,
  totalCount,
  filteredFestivals,
}: UseFestivalsSEOOptions) {
  // Dynamic SEO
  const seoData = useMemo(() => {
    let title = 'Festivales de Música en América Latina 2026';
    let description = 'Descubre todos los festivales de música en América Latina 2026. ';
    let keywords = 'festivales 2026, festivales de música, festivales latinoamérica, eventos musicales, lineup festivales, ';

    if (selectedCityName) {
      title = `Festivales de Música en ${selectedCityName} 2026`;
      description = `Calendario completo de festivales de música en ${selectedCityName} 2026. `;
      keywords += `festivales en ${selectedCityName}, eventos ${selectedCityName}, `;
    } else if (selectedCountryName) {
      title = `Festivales de Música en ${selectedCountryName} 2026`;
      description = `Todos los festivales de música en ${selectedCountryName} 2026. `;
      keywords += `festivales en ${selectedCountryName}, festivales ${selectedCountryName} 2026, `;
    }

    if (filterStatus === 'upcoming') {
      title = `Próximos ${title}`;
      description += 'Fechas, lineup, entradas y toda la información de los próximos festivales. ';
    } else if (filterStatus === 'past') {
      title = `${title} - Historial`;
      description += 'Revive los mejores festivales pasados con fotos y setlists. ';
    }

    description += `Conciertos Latam - La plataforma #1 de festivales de música en vivo en Latinoamérica con ${totalCount}+ eventos.`;
    keywords += 'Lollapalooza, Estéreo Picnic, Vive Latino, festivales rock, festivales electrónica, entradas festivales, boletas festivales';

    return { title, description, keywords };
  }, [selectedCityName, selectedCountryName, filterStatus, totalCount]);

  // Enhanced structured data for SEO - Festival List
  const structuredData = useMemo(() => {
    const festivalListData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": seoData.title,
      "description": seoData.description,
      "url": `${SITE_URL}/festivals`,
      "numberOfItems": totalCount,
      "itemListElement": filteredFestivals.slice(0, 10).map((festival, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "MusicEvent",
          "@id": `${SITE_URL}/festivals/${festival.slug}`,
          "name": festival.name,
          "description": festival.description || `Festival ${festival.name} en ${festival.venues?.cities?.name || 'América Latina'}`,
          "image": festival.image_url || getDefaultImage(),
          "startDate": festival.start_date || undefined,
          "endDate": festival.end_date || undefined,
          "eventStatus": "https://schema.org/EventScheduled",
          "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
          "location": {
            "@type": "Place",
            "name": festival.venues?.name || "Venue por confirmar",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": festival.venues?.cities?.name || "",
              "addressCountry": festival.venues?.cities?.countries?.name || ""
            }
          },
          "performer": festival.lineup_artists && festival.lineup_artists.length > 0
            ? festival.lineup_artists.map(artist => ({
              "@type": "MusicGroup",
              "name": artist
            }))
            : undefined,
          "organizer": {
            "@type": "Organization",
            "name": "Conciertos Latam",
            "url": SITE_URL
          },
          "offers": festival.ticket_url ? {
            "@type": "Offer",
            "url": festival.ticket_url,
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
      "description": "La plataforma #1 de festivales y eventos musicales en América Latina",
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
          "urlTemplate": `${SITE_URL}/festivals?search={search_term_string}`
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
          "name": "¿Dónde puedo encontrar todos los festivales de música en América Latina?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "En Conciertos Latam encuentras el calendario más completo de festivales de música en América Latina. Tenemos información de eventos en México, Colombia, Argentina, Chile, Perú y más países con lineups, fechas y entradas."
          }
        },
        {
          "@type": "Question",
          "name": "¿Cómo comprar entradas para festivales?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "En cada festival listado encontrarás un enlace directo a la venta oficial de entradas. Te conectamos con proveedores autorizados como Ticketmaster, TuBoleta, Passline y más."
          }
        },
        {
          "@type": "Question",
          "name": "¿Qué festivales de música hay en América Latina 2026?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Los festivales más importantes de América Latina 2026 incluyen Lollapalooza (Chile, Argentina, Brasil), Estéreo Picnic (Colombia), Vive Latino (México), entre muchos otros. Consulta nuestro calendario actualizado."
          }
        }
      ]
    };

    return [festivalListData, organizationData, websiteData, faqData];
  }, [filteredFestivals, totalCount, seoData]);

  return { seoData, structuredData };
}
