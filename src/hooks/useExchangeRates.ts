import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ExchangeRates {
  ZAR: number;
  EUR: number;
  GBP: number;
  USD: number;
  THB: number;
  [key: string]: number; // Index signature for compatibility
}

interface UseExchangeRatesReturn {
  rates: ExchangeRates | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  convertPrice: (amount: number, fromCurrency?: string, toCurrency?: string) => number;
  refetch: () => Promise<void>;
}

// Default fallback rates (ZAR as base)
const FALLBACK_RATES: ExchangeRates = {
  ZAR: 1,
  EUR: 0.052,
  GBP: 0.044,
  USD: 0.057,
  THB: 1.98,
};

// Currency code mapping from country to currency
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  PT: 'EUR',
  ZA: 'ZAR',
  GB: 'GBP',
  TH: 'THB',
  US: 'USD',
};

export function useExchangeRates(): UseExchangeRatesReturn {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('exchange-rates', {
        body: { action: 'get-rates' },
      });

      if (fnError) {
        throw fnError;
      }

      if (data?.success && data?.rates) {
        setRates(data.rates);
        setLastUpdated(data.lastUpdated ? new Date(data.lastUpdated) : new Date());
        console.log('[Exchange Rates] Loaded live rates:', data.rates);
      } else {
        throw new Error('Invalid response from exchange rates API');
      }
    } catch (err) {
      console.error('[Exchange Rates] Error fetching rates:', err);
      setError('Failed to fetch exchange rates, using fallback');
      setRates(FALLBACK_RATES);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();

    // Refresh rates every hour
    const interval = setInterval(fetchRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  const convertPrice = useCallback(
    (amount: number, fromCurrency: string = 'ZAR', toCurrency: string = 'ZAR'): number => {
      const currentRates = rates || FALLBACK_RATES;
      
      // Handle country codes
      const from = COUNTRY_TO_CURRENCY[fromCurrency] || fromCurrency as keyof ExchangeRates;
      const to = COUNTRY_TO_CURRENCY[toCurrency] || toCurrency as keyof ExchangeRates;
      
      // If same currency, no conversion needed
      if (from === to) {
        return amount;
      }

      // Get rates (rates are relative to ZAR)
      const fromRate = currentRates[from] || 1;
      const toRate = currentRates[to] || 1;

      // Convert: amount -> ZAR -> target currency
      // fromRate = how much 1 ZAR is worth in fromCurrency
      // toRate = how much 1 ZAR is worth in toCurrency
      const amountInZAR = amount / fromRate;
      const convertedAmount = amountInZAR * toRate;

      return Math.round(convertedAmount * 100) / 100;
    },
    [rates]
  );

  return {
    rates,
    isLoading,
    error,
    lastUpdated,
    convertPrice,
    refetch: fetchRates,
  };
}

// Helper to get currency from country code
export function getCurrencyFromCountry(countryCode: string): string {
  return COUNTRY_TO_CURRENCY[countryCode] || 'ZAR';
}
