import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from various possible headers
    const clientIP = 
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      req.headers.get('cf-connecting-ip') ||
      '8.8.8.8'; // Default to Google DNS for testing

    console.log('Client IP:', clientIP);

    // Use ipapi.co to get country from IP
    const ipApiUrl = `https://ipapi.co/${clientIP}/json/`;
    console.log('Fetching from:', ipApiUrl);
    
    const ipApiResponse = await fetch(ipApiUrl, {
      headers: {
        'User-Agent': 'Conciertos Latam/1.0'
      }
    });
    
    console.log('IP API Response status:', ipApiResponse.status);
    
    if (!ipApiResponse.ok) {
      const errorText = await ipApiResponse.text();
      console.error('IP API Error:', errorText);
      
      // Fallback to Colombia for development/testing
      console.log('Using fallback country: Colombia');
      const { data: country } = await supabase
        .from('countries')
        .select('id, name, iso_code')
        .eq('iso_code', 'CO')
        .single();
        
      if (country) {
        return new Response(
          JSON.stringify({ 
            country_id: country.id,
            country_name: country.name,
            country_code: country.iso_code,
            fallback: true
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      throw new Error(`Failed to fetch IP location: ${errorText}`);
    }

    const ipData = await ipApiResponse.json();
    console.log('IP Data:', ipData);
    
    const countryCode = ipData.country_code || ipData.country;

    console.log('Detected country code:', countryCode);

    if (!countryCode) {
      console.log('No country code found, using fallback');
      // Fallback to Colombia
      const { data: country } = await supabase
        .from('countries')
        .select('id, name, iso_code')
        .eq('iso_code', 'CO')
        .single();
        
      if (country) {
        return new Response(
          JSON.stringify({ 
            country_id: country.id,
            country_name: country.name,
            country_code: country.iso_code,
            fallback: true
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Could not detect country' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get country ID from Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Looking up country in database:', countryCode);
    const { data: country, error } = await supabase
      .from('countries')
      .select('id, name, iso_code')
      .eq('iso_code', countryCode)
      .single();

    if (error || !country) {
      console.error('Country not found in database:', error);
      console.log('Using fallback country: Colombia');
      
      // Fallback to Colombia
      const { data: fallbackCountry } = await supabase
        .from('countries')
        .select('id, name, iso_code')
        .eq('iso_code', 'CO')
        .single();
        
      if (fallbackCountry) {
        return new Response(
          JSON.stringify({ 
            country_id: fallbackCountry.id,
            country_name: fallbackCountry.name,
            country_code: fallbackCountry.iso_code,
            fallback: true
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Country not found in database' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Country found:', country);
    return new Response(
      JSON.stringify({ 
        country_id: country.id,
        country_name: country.name,
        country_code: country.iso_code
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    
    // Try to return Colombia as ultimate fallback
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: fallbackCountry } = await supabase
        .from('countries')
        .select('id, name, iso_code')
        .eq('iso_code', 'CO')
        .single();
        
      if (fallbackCountry) {
        return new Response(
          JSON.stringify({ 
            country_id: fallbackCountry.id,
            country_name: fallbackCountry.name,
            country_code: fallbackCountry.iso_code,
            fallback: true,
            error: error.message
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } catch {}
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
