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

    console.log('Fetching all published articles for blog sitemap');

    // Get ALL published articles (not just recent ones like news sitemap)
    const { data: articles, error } = await supabase
      .from('news_articles')
      .select('slug, updated_at, published_at, title, featured_image')
      .eq('status', 'published')
      .not('slug', 'is', null)
      .not('title', 'is', null)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }

    // Filter out articles with empty slugs
    const validArticles = articles?.filter(article => 
      article.slug && article.slug.trim() !== ''
    ) || [];

    console.log(`Found ${validArticles.length} published articles for blog sitemap`);

    const baseUrl = 'https://www.conciertoslatam.app';
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const urlEntries = validArticles.map(article => {
      const lastmod = new Date(article.updated_at).toISOString().split('T')[0];
      const publishedDate = new Date(article.published_at);
      
      // Recent articles get higher priority
      const isRecent = publishedDate > thirtyDaysAgo;
      const priority = isRecent ? '0.8' : '0.6';
      const changefreq = isRecent ? 'weekly' : 'monthly';
      
      const imageTag = article.featured_image ? `
    <image:image>
      <image:loc>${escapeXml(article.featured_image)}</image:loc>
      <image:title>${escapeXml(article.title)}</image:title>
    </image:image>` : '';
      
      return `  <url>
    <loc>${baseUrl}/blog/${escapeXml(article.slug)}</loc>
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
    console.error('Error generating blog sitemap:', error);
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
