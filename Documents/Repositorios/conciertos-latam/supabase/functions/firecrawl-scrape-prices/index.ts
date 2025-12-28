const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TicketPrice {
  zone: string;
  price: string;
  service_fee?: string;
  currency: string;
  availability: string;
  is_presale?: boolean;
}

interface ExtractedPrices {
  presale_prices: TicketPrice[];
  regular_prices: TicketPrice[];
  general_sale_date: string | null;
  presale_date: string | null;
  venue_name: string | null;
  event_name: string | null;
  source_url: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping ticket prices from URL:', formattedUrl);

    // Use Firecrawl with extract format for structured price data
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['extract'],
        extract: {
          prompt: `Extract ticket pricing information from this concert/event ticket page. 
            IMPORTANT: Separate prices into TWO categories:
            1. PRESALE PRICES (preventa): Prices marked as "preventa", "pre-sale", "early bird", or with special presale conditions
            2. REGULAR PRICES (venta general/full price): Standard prices without presale discounts
            
            For EACH price entry, also extract:
            - The base ticket price
            - The SERVICE FEE (cargo por servicio, servicio tiquetera, comisión) if shown separately
            - Availability status
            
            Look for:
            - All ticket zones/sections with their prices
            - Currency (detect from page, common: COP, MXN, USD, ARS, CLP, PEN, BRL)
            - Availability status for each zone
            - Presale date if mentioned
            - General sale date if mentioned
            - Venue name
            - Event/concert name
            
            For prices, extract the numeric value and keep currency symbol. 
            For availability, use: "Disponible", "Agotado", "Pocas unidades", or "Próximamente"`,
          schema: {
            type: 'object',
            properties: {
              presale_prices: {
                type: 'array',
                description: 'List of PRESALE ticket zones with prices (preventa, early bird prices)',
                items: {
                  type: 'object',
                  properties: {
                    zone: { 
                      type: 'string', 
                      description: 'Name of the zone/section (e.g., VIP, Preferencial, General, Platea)' 
                    },
                    price: { 
                      type: 'string', 
                      description: 'Base ticket price with currency symbol (e.g., $450.000, US$150)' 
                    },
                    service_fee: {
                      type: 'string',
                      description: 'Service fee/charge by ticketing platform if shown (e.g., $25.000)'
                    },
                    currency: { 
                      type: 'string', 
                      description: 'Currency code (COP, MXN, USD, ARS, CLP, PEN, BRL)' 
                    },
                    availability: { 
                      type: 'string', 
                      description: 'Availability status: Disponible, Agotado, Pocas unidades, Próximamente' 
                    }
                  },
                  required: ['zone', 'price']
                }
              },
              regular_prices: {
                type: 'array',
                description: 'List of REGULAR/FULL ticket zones with prices (venta general, standard prices)',
                items: {
                  type: 'object',
                  properties: {
                    zone: { 
                      type: 'string', 
                      description: 'Name of the zone/section (e.g., VIP, Preferencial, General, Platea)' 
                    },
                    price: { 
                      type: 'string', 
                      description: 'Base ticket price with currency symbol (e.g., $450.000, US$150)' 
                    },
                    service_fee: {
                      type: 'string',
                      description: 'Service fee/charge by ticketing platform if shown (e.g., $25.000)'
                    },
                    currency: { 
                      type: 'string', 
                      description: 'Currency code (COP, MXN, USD, ARS, CLP, PEN, BRL)' 
                    },
                    availability: { 
                      type: 'string', 
                      description: 'Availability status: Disponible, Agotado, Pocas unidades, Próximamente' 
                    }
                  },
                  required: ['zone', 'price']
                }
              },
              presale_date: { 
                type: 'string', 
                description: 'Presale start date if available (format: DD/MM/YYYY or text)' 
              },
              general_sale_date: { 
                type: 'string', 
                description: 'General sale start date if available (format: DD/MM/YYYY or text)' 
              },
              venue_name: { 
                type: 'string', 
                description: 'Name of the venue where the event takes place' 
              },
              event_name: { 
                type: 'string', 
                description: 'Name of the event/concert' 
              }
            },
            required: ['presale_prices', 'regular_prices']
          }
        },
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the data from the response
    const extractedData = data.data?.extract || data.extract || {};
    
    console.log('Extracted price data:', JSON.stringify(extractedData));

    const result: ExtractedPrices = {
      presale_prices: extractedData.presale_prices || [],
      regular_prices: extractedData.regular_prices || [],
      general_sale_date: extractedData.general_sale_date || null,
      presale_date: extractedData.presale_date || null,
      venue_name: extractedData.venue_name || null,
      event_name: extractedData.event_name || null,
      source_url: formattedUrl,
    };

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping ticket prices:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape prices';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
