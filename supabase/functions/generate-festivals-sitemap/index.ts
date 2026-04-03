// @ts-ignore: Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// @ts-ignore: Deno serve
Deno.serve(async (req: any) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // @ts-ignore: Deno env
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        // @ts-ignore: Deno env
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('Fetching festivals for sitemap generation');

        // Fetch all festivals with valid data
        const { data: festivals, error } = await supabase
            .from('festivals')
            .select('slug, start_date, updated_at, name, image_url')
            .not('slug', 'is', null)
            .not('name', 'is', null)
            .order('start_date', { ascending: false });

        if (error) {
            console.error('Error fetching festivals:', error);
            throw error;
        }

        // Filter out festivals with empty slugs or names
        const validFestivals = festivals?.filter((festival: any) =>
            festival.slug &&
            festival.slug.trim() !== '' &&
            festival.name &&
            festival.name.trim() !== ''
        ) || [];

        console.log(`Found ${validFestivals.length} valid festivals for sitemap`);

        const baseUrl = 'https://www.conciertoslatam.app';
        const today = new Date().toISOString().split('T')[0];

        const urlEntries = validFestivals.map((festival: any) => {
            const lastmod = new Date(festival.updated_at).toISOString().split('T')[0];
            const isUpcoming = festival.start_date >= today;
            const priority = isUpcoming ? '0.9' : '0.7';
            const changefreq = isUpcoming ? 'weekly' : 'monthly';

            const imageTag = festival.image_url ? `
    <image:image>
      <image:loc>${escapeXml(festival.image_url)}</image:loc>
      <image:title>${escapeXml(festival.name)}</image:title>
    </image:image>` : '';

            return `  <url>
    <loc>${baseUrl}/festivales/${escapeXml(festival.slug)}</loc>
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
    } catch (error: any) {
        console.error('Error generating festivals sitemap:', error);
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
