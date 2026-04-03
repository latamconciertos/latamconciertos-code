import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Countries with concert pages - slug matches the route /conciertos/:countrySlug
const LATAM_COUNTRIES = [
  { slug: 'argentina', name: 'Argentina', iso: 'AR' },
  { slug: 'bolivia', name: 'Bolivia', iso: 'BO' },
  { slug: 'brasil', name: 'Brasil', iso: 'BR' },
  { slug: 'chile', name: 'Chile', iso: 'CL' },
  { slug: 'colombia', name: 'Colombia', iso: 'CO' },
  { slug: 'costa-rica', name: 'Costa Rica', iso: 'CR' },
  { slug: 'ecuador', name: 'Ecuador', iso: 'EC' },
  { slug: 'el-salvador', name: 'El Salvador', iso: 'SV' },
  { slug: 'guatemala', name: 'Guatemala', iso: 'GT' },
  { slug: 'honduras', name: 'Honduras', iso: 'HN' },
  { slug: 'mexico', name: 'México', iso: 'MX' },
  { slug: 'nicaragua', name: 'Nicaragua', iso: 'NI' },
  { slug: 'panama', name: 'Panamá', iso: 'PA' },
  { slug: 'paraguay', name: 'Paraguay', iso: 'PY' },
  { slug: 'peru', name: 'Perú', iso: 'PE' },
  { slug: 'puerto-rico', name: 'Puerto Rico', iso: 'PR' },
  { slug: 'republica-dominicana', name: 'República Dominicana', iso: 'DO' },
  { slug: 'uruguay', name: 'Uruguay', iso: 'UY' },
  { slug: 'venezuela', name: 'Venezuela', iso: 'VE' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating countries sitemap');

    // Get countries that actually have concerts
    const { data: countriesWithConcerts, error } = await supabase
      .from('countries')
      .select('iso_code, updated_at')
      .in('iso_code', LATAM_COUNTRIES.map(c => c.iso));

    if (error) {
      console.error('Error fetching countries:', error);
    }

    const countryLastMod = new Map(
      countriesWithConcerts?.map(c => [c.iso_code, c.updated_at]) || []
    );

    const baseUrl = 'https://www.conciertoslatam.app';
    const today = new Date().toISOString().split('T')[0];
    
    const urlEntries = LATAM_COUNTRIES.map(country => {
      const lastmod = countryLastMod.get(country.iso) 
        ? new Date(countryLastMod.get(country.iso)!).toISOString().split('T')[0]
        : today;
      
      return `  <url>
    <loc>${baseUrl}/conciertos/${country.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>`;
    }).join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

    console.log(`Generated sitemap with ${LATAM_COUNTRIES.length} country pages`);

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating countries sitemap:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
