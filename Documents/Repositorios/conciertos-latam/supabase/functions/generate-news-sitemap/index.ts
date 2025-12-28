import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsArticle {
  slug: string;
  title: string;
  published_at: string;
  meta_keywords: string | null;
  categories: { name: string } | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching recent news articles for sitemap...');

    // Obtener artículos publicados en los últimos 2 días (requisito de Google News)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const { data: articles, error } = await supabase
      .from('news_articles')
      .select(`
        slug,
        title,
        published_at,
        meta_keywords,
        categories:category_id (name)
      `)
      .eq('status', 'published')
      .gte('published_at', twoDaysAgo.toISOString())
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }

    console.log(`Found ${articles?.length || 0} recent articles`);

    // Generar XML del sitemap de noticias
    const siteUrl = 'https://www.conciertoslatam.app';
    const xmlContent = generateNewsSitemapXML(articles || [], siteUrl);

    return new Response(xmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
      },
    });
  } catch (error) {
    console.error('Error generating news sitemap:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateNewsSitemapXML(articles: NewsArticle[], siteUrl: string): string {
  const urlEntries = articles.map((article) => {
    const fullUrl = `${siteUrl}/blog/${article.slug}`;
    const publishDate = new Date(article.published_at).toISOString();
    const keywords = article.meta_keywords || article.categories?.name || 'música, conciertos';

    return `  <url>
    <loc>${escapeXml(fullUrl)}</loc>
    <news:news>
      <news:publication>
        <news:name>Conciertos Latam</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>${publishDate}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
      <news:keywords>${escapeXml(keywords)}</news:keywords>
    </news:news>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
