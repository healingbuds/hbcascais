import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Free exchange rate API - no key required
const EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest/ZAR';

// Cache duration: 1 hour
const CACHE_DURATION_MS = 60 * 60 * 1000;

// In-memory cache for rates
let ratesCache: {
  rates: Record<string, number>;
  baseCurrency: string;
  timestamp: number;
} | null = null;

interface ExchangeRateResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

async function fetchExchangeRates(): Promise<Record<string, number>> {
  // Check cache first
  if (ratesCache && Date.now() - ratesCache.timestamp < CACHE_DURATION_MS) {
    console.log('[Exchange Rates] Using cached rates');
    return ratesCache.rates;
  }

  console.log('[Exchange Rates] Fetching fresh rates from API');
  
  try {
    // Fetch rates with ZAR as base (Dr. Green API uses ZAR)
    const response = await fetch(EXCHANGE_API_URL);
    
    if (!response.ok) {
      throw new Error(`Exchange API error: ${response.status}`);
    }

    const data: ExchangeRateResponse = await response.json();
    
    // API returns rates relative to ZAR, so 1 ZAR = X other currency
    const rates = data.rates;
    
    // Update cache
    ratesCache = {
      rates,
      baseCurrency: 'ZAR',
      timestamp: Date.now(),
    };
    
    console.log('[Exchange Rates] Cached rates for:', Object.keys(rates).length, 'currencies');
    return rates;
  } catch (error) {
    console.error('[Exchange Rates] API error:', error);
    
    // Return fallback static rates if API fails
    return {
      ZAR: 1,
      EUR: 0.052,   // ~19 ZAR per EUR
      GBP: 0.044,   // ~23 ZAR per GBP
      USD: 0.057,   // ~17.5 ZAR per USD
      THB: 1.98,    // ~0.5 ZAR per THB
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, amount, fromCurrency, toCurrency, amounts } = body;

    // Get current exchange rates
    const rates = await fetchExchangeRates();

    // Action: Get all rates
    if (action === 'get-rates') {
      return new Response(
        JSON.stringify({
          success: true,
          baseCurrency: 'ZAR',
          rates: {
            ZAR: 1,
            EUR: rates.EUR || 0.052,
            GBP: rates.GBP || 0.044,
            USD: rates.USD || 0.057,
            THB: rates.THB || 1.98,
          },
          lastUpdated: ratesCache?.timestamp || Date.now(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Convert a single amount
    if (action === 'convert' && amount !== undefined && toCurrency) {
      const from = fromCurrency || 'ZAR';
      
      // Convert from source to ZAR first (if not already ZAR)
      let amountInZAR = amount;
      if (from !== 'ZAR') {
        const fromRate = rates[from];
        if (!fromRate) {
          throw new Error(`Unsupported currency: ${from}`);
        }
        // fromRate is ZAR to FROM, so we divide to get ZAR
        amountInZAR = amount / fromRate;
      }
      
      // Convert from ZAR to target currency
      const toRate = rates[toCurrency];
      if (!toRate) {
        throw new Error(`Unsupported currency: ${toCurrency}`);
      }
      
      const convertedAmount = amountInZAR * toRate;
      
      return new Response(
        JSON.stringify({
          success: true,
          originalAmount: amount,
          originalCurrency: from,
          convertedAmount: Math.round(convertedAmount * 100) / 100,
          targetCurrency: toCurrency,
          rate: toRate,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Batch convert multiple amounts
    if (action === 'batch-convert' && amounts && toCurrency) {
      const toRate = rates[toCurrency] || 1;
      
      const converted = amounts.map((item: { id: string; amount: number; fromCurrency?: string }) => {
        const from = item.fromCurrency || 'ZAR';
        let amountInZAR = item.amount;
        
        if (from !== 'ZAR') {
          const fromRate = rates[from];
          if (fromRate) {
            amountInZAR = item.amount / fromRate;
          }
        }
        
        return {
          id: item.id,
          originalAmount: item.amount,
          convertedAmount: Math.round(amountInZAR * toRate * 100) / 100,
        };
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          targetCurrency: toCurrency,
          rate: toRate,
          converted,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: get-rates, convert, or batch-convert' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Exchange Rates] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
