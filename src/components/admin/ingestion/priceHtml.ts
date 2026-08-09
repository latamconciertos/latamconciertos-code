import type { PriceData } from '@/types/entities';

// Renders extracted price zones to the same HTML shape concerts.ticket_prices_html expects.
export function priceDataToHtml(priceData: PriceData | null): string {
  if (!priceData || priceData.type !== 'zones' || !priceData.zones?.length) return '';
  const rows = priceData.zones
    .map((z) => {
      const label = [z.zone, z.stage].filter(Boolean).join(' — ');
      const amount = z.total || z.price || '';
      const fee = z.service_fee ? ` <span class="text-xs opacity-70">(+ ${z.service_fee} servicio)</span>` : '';
      return `<li><strong>${label}</strong>: ${amount}${fee}</li>`;
    })
    .join('');
  return `<ul class="ticket-prices">${rows}</ul>`;
}
