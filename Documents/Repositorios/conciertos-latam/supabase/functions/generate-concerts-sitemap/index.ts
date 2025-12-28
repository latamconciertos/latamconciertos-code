import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching concerts for sitemap generation');

    // Obtener conciertos de los últimos 18 meses y futuros
    const eighteenMonthsAgo = new Date();
    eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);
    const eighteenMonthsAgoStr = eighteenMonthsAgo.toISOString().split('T')[0];

    const { data: concerts, error } = await supabase
      .from('concerts')
      .select('slug, date, updated_at, title, image_url, event_type')
      .gte('date', eighteenMonthsAgoStr)
      .not('slug', 'is', null)
      .not('title', 'is', null)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching concerts:', error);
      throw error;
    }

    // Filter out concerts with empty slugs or titles
    const validConcerts = concerts?.filter(concert => 
      concert.slug && 
      concert.slug.trim() !== '' && 
      concert.title && 
      concert.title.trim() !== ''
    ) || [];

    console.log(`Found ${validConcerts.length} valid concerts for sitemap`);

    const baseUrl = 'https://www.conciertoslatam.app';
    const today = new Date().toISOString().split('T')[0];
    
    const urlEntries = validConcerts.map(concert => {
      const lastmod = new Date(concert.updated_at).toISOString().split('T')[0];
      const isUpcoming = concert.date >= today;
      const priority = isUpcoming ? '0.9' : '0.6';
      const changefreq = isUpcoming ? 'daily' : 'monthly';
      
      const imageTag = concert.image_url ? `
    <image:image>
      <image:loc>${escapeXml(concert.image_url)}</image:loc>
      <image:title>${escapeXml(concert.title)}</image:title>
    </image:image>` : '';
      
      return `  <url>
    <loc>${baseUrl}/concerts/${escapeXml(concert.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageTag}
  </url>`;
    }).join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating concerts sitemap:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
