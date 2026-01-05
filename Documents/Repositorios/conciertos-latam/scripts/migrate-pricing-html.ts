import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = `https://${process.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!process.env.VITE_SUPABASE_PROJECT_ID || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Required: VITE_SUPABASE_PROJECT_ID and VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

console.log(`🔗 Connecting to: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

interface TicketPrice {
  zone: string;
  price: string;
  service_fee?: string;
}

// Generate new pricing HTML using CSS classes
function generatePriceTableHtml(prices: TicketPrice[], title: string): string {
  if (!prices || prices.length === 0) return '';

  const hasServiceFees = prices.some(p => p.service_fee);
  const gridClass = hasServiceFees ? 'has-service-fees' : '';

  // Generate price items HTML
  const priceItems = prices.map(p => `
    <div class="price-item ${gridClass}">
      <span class="price-zone">${p.zone}</span>
      <span class="price-amount">${p.price}</span>
      ${hasServiceFees ? `<span class="price-service">${p.service_fee || '-'}</span>` : ''}
    </div>
  `.trim()).join('\n    ');

  // Header HTML
  const headerHtml = `
    <div class="price-header ${gridClass}">
      <span>Zona</span>
      <span>Precio</span>
      ${hasServiceFees ? '<span>Servicio</span>' : ''}
    </div>
  `.trim();

  // Subsection with simple h4 label
  return `
<div class="price-subsection">
  <h4>${title}</h4>
  ${headerHtml}
  <div class="price-list">
    ${priceItems}
  </div>
</div>`;
}

// Extract prices from old HTML format
function extractPricesFromOldHtml(html: string): {
  presale: TicketPrice[];
  regular: TicketPrice[];
  sourceUrl?: string;
  updateDate?: string;
} {
  const presale: TicketPrice[] = [];
  const regular: TicketPrice[] = [];

  // Extract presale section
  const presaleRegex = /Precios Preventa.*?<\/table>/s;
  const presaleMatch = html.match(presaleRegex);

  if (presaleMatch) {
    // Extract rows with 4 columns (zone, price, service, availability)
    const rowRegex4Col = /<tr>\s*<td[^>]*><strong>(.*?)<\/strong><\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>.*?<\/td>\s*<\/tr>/g;
    // Extract rows with 3 columns (zone, price, availability)
    const rowRegex3Col = /<tr>\s*<td[^>]*><strong>(.*?)<\/strong><\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>.*?<\/td>\s*<\/tr>/g;

    let match;

    // Try 4 column format first (with service fee)
    while ((match = rowRegex4Col.exec(presaleMatch[0])) !== null) {
      presale.push({
        zone: match[1].trim(),
        price: match[2].trim(),
        service_fee: match[3].trim()
      });
    }

    // If no matches, try 3 column format (without service fee)
    if (presale.length === 0) {
      while ((match = rowRegex3Col.exec(presaleMatch[0])) !== null) {
        presale.push({
          zone: match[1].trim(),
          price: match[2].trim()
        });
      }
    }
  }

  // Extract regular section
  const regularRegex = /Precios Venta General.*?<\/table>/s;
  const regularMatch = html.match(regularRegex);

  if (regularMatch) {
    const rowRegex4Col = /<tr>\s*<td[^>]*><strong>(.*?)<\/strong><\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>.*?<\/td>\s*<\/tr>/g;
    const rowRegex3Col = /<tr>\s*<td[^>]*><strong>(.*?)<\/strong><\/td>\s*<td[^>]*>(.*?)<\/td>\s*<td[^>]*>.*?<\/td>\s*<\/tr>/g;

    let match;

    while ((match = rowRegex4Col.exec(regularMatch[0])) !== null) {
      regular.push({
        zone: match[1].trim(),
        price: match[2].trim(),
        service_fee: match[3].trim()
      });
    }

    if (regular.length === 0) {
      while ((match = rowRegex3Col.exec(regularMatch[0])) !== null) {
        regular.push({
          zone: match[1].trim(),
          price: match[2].trim()
        });
      }
    }
  }

  // Extract metadata
  const sourceUrlMatch = html.match(/Fuente:\s*<a href="([^"]+)"/);
  const updateDateMatch = html.match(/Precios actualizados:\s*([^|]+)/);

  return {
    presale,
    regular,
    sourceUrl: sourceUrlMatch?.[1],
    updateDate: updateDateMatch?.[1]?.trim()
  };
}

// Generate complete pricing HTML block
function generateCompletePricingHtml(parsedData: ReturnType<typeof extractPricesFromOldHtml>): string {
  const { presale, regular, sourceUrl, updateDate } = parsedData;

  const hasPresale = presale.length > 0;
  const hasRegular = regular.length > 0;

  if (!hasPresale && !hasRegular) return '';

  const today = updateDate || new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  let sourceDomain = '';
  if (sourceUrl) {
    try {
      sourceDomain = new URL(sourceUrl).hostname.replace('www.', '');
    } catch {
      sourceDomain = 'fuente oficial';
    }
  } else {
    sourceDomain = 'fuente oficial';
  }

  const presaleTable = hasPresale
    ? generatePriceTableHtml(presale, '🎟️ Precios Preventa')
    : '';

  const regularTable = hasRegular
    ? generatePriceTableHtml(regular, '🎫 Precios Venta General')
    : '';

  return `
<div class="price-section">
  <h3>🎫 Precios de Entradas</h3>
  ${presaleTable}
  ${regularTable}
  <p><em>Precios actualizados: ${today}${sourceUrl ? ` | Fuente: <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">${sourceDomain}</a>` : ''}</em></p>
</div>
`.trim();
}

async function migrateConcerts() {
  console.log('🚀 Iniciando migración de tablas de precios...\n');

  // Get all concerts with pricing
  const { data: concerts, error } = await supabase
    .from('concerts')
    .select('id, slug, title, ticket_prices_html')
    .not('ticket_prices_html', 'is', null);

  if (error) {
    console.error('❌ Error obteniendo conciertos:', error);
    return;
  }

  console.log(`📊 Encontrados ${concerts.length} conciertos con precios\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const concert of concerts) {
    try {
      // Skip if already in new format (check for price-section class)
      if (concert.ticket_prices_html.includes('class="price-section"') &&
        concert.ticket_prices_html.includes('class="price-zone"')) {
        console.log(`⏭️  Ya actualizado: ${concert.slug}`);
        skipped++;
        continue;
      }

      // Extract data from old HTML
      const parsedData = extractPricesFromOldHtml(concert.ticket_prices_html);

      if (parsedData.presale.length === 0 && parsedData.regular.length === 0) {
        console.log(`⚠️  No se pudieron extraer precios: ${concert.slug}`);
        skipped++;
        continue;
      }

      // Generate new HTML
      const newHtml = generateCompletePricingHtml(parsedData);

      // Update in database
      const { error: updateError } = await supabase
        .from('concerts')
        .update({ ticket_prices_html: newHtml })
        .eq('id', concert.id);

      if (updateError) {
        console.error(`❌ Error actualizando ${concert.slug}:`, updateError.message);
        errors++;
      } else {
        console.log(`✅ Actualizado: ${concert.title}`);
        updated++;
      }
    } catch (err) {
      console.error(`❌ Error procesando ${concert.slug}:`, err);
      errors++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Resumen de migración:`);
  console.log(`${'='.repeat(50)}`);
  console.log(`✅ Actualizados: ${updated}`);
  console.log(`⏭️  Omitidos: ${skipped}`);
  console.log(`❌ Errores: ${errors}`);
  console.log(`📝 Total procesados: ${concerts.length}`);
  console.log(`${'='.repeat(50)}\n`);
}

// Run migration
migrateConcerts()
  .then(() => {
    console.log('✨ Migración completada');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Error fatal:', err);
    process.exit(1);
  });
