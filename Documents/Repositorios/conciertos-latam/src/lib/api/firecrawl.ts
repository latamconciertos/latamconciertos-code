import { supabase } from '@/integrations/supabase/client';

export interface TicketPrice {
  zone: string;
  price: string;
  service_fee?: string;
  currency?: string;
  availability?: string;
}

export interface ExtractedPrices {
  presale_prices: TicketPrice[];
  regular_prices: TicketPrice[];
  general_sale_date?: string | null;
  presale_date?: string | null;
  venue_name?: string | null;
  event_name?: string | null;
  source_url?: string;
  notes?: string;
}

export interface FirecrawlResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export const firecrawlApi = {
  /**
   * Scrape ticket prices from a URL using Firecrawl
   */
  async scrapeTicketPrices(url: string): Promise<FirecrawlResponse<ExtractedPrices>> {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape-prices', {
      body: { url },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  /**
   * Extract ticket prices from an image using AI Vision
   */
  async extractPricesFromImage(imageUrl?: string, imageBase64?: string): Promise<FirecrawlResponse<ExtractedPrices>> {
    const { data, error } = await supabase.functions.invoke('extract-prices-from-image', {
      body: { imageUrl, imageBase64 },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};
