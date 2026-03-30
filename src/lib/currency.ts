// Currency utility for country-based formatting and conversion
// Maps country codes to their respective currencies

const currencyMap: Record<string, string> = {
  PT: 'EUR',
  ZA: 'ZAR',
  GB: 'GBP',
  TH: 'THB',
  US: 'USD',
};

const currencySymbols: Record<string, string> = {
  EUR: '€',
  ZAR: 'R',
  GBP: '£',
  THB: '฿',
  USD: '$',
};

// Default exchange rates (ZAR base) - used as fallback
// These are updated by the exchange-rates edge function
let cachedRates: Record<string, number> = {
  ZAR: 1,
  EUR: 0.052,
  GBP: 0.044,
  USD: 0.057,
  THB: 1.98,
};

export function getCurrencyForCountry(countryCode: string): string {
  return currencyMap[countryCode] || 'ZAR';
}

export function getCurrencySymbol(currencyCode: string): string {
  return currencySymbols[currencyCode] || 'R';
}

// Update cached rates (called from useExchangeRates hook)
export function updateCachedRates(rates: { [key: string]: number }): void {
  cachedRates = { ...cachedRates, ...rates };
}

// Convert price from source currency (usually ZAR from API) to target currency
export function convertPrice(
  amount: number,
  fromCountryOrCurrency: string = 'ZA',
  toCountryOrCurrency: string = 'ZA',
  rates?: Record<string, number>
): number {
  const ratesMap = rates || cachedRates;
  
  // Get currency codes
  const fromCurrency = currencyMap[fromCountryOrCurrency] || fromCountryOrCurrency;
  const toCurrency = currencyMap[toCountryOrCurrency] || toCountryOrCurrency;
  
  // If same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  // Get rates (rates are relative to ZAR - how much 1 ZAR equals in that currency)
  const fromRate = ratesMap[fromCurrency] || 1;
  const toRate = ratesMap[toCurrency] || 1;
  
  // Convert: amount -> ZAR -> target currency
  const amountInZAR = amount / fromRate;
  const convertedAmount = amountInZAR * toRate;
  
  return Math.round(convertedAmount * 100) / 100;
}

export function formatPrice(
  amount: number,
  countryCode: string = 'ZA',
  options?: { 
    showSymbol?: boolean;
    convertFrom?: string;
    rates?: Record<string, number>;
  }
): string {
  const { showSymbol = true, convertFrom, rates } = options || {};
  
  // ALWAYS default to ZA if countryCode is empty/invalid
  const validCountryCode = countryCode && currencyMap[countryCode] ? countryCode : 'ZA';
  const currency = getCurrencyForCountry(validCountryCode);
  
  // Convert price if source currency specified
  let displayAmount = amount;
  if (convertFrom && convertFrom !== validCountryCode) {
    displayAmount = convertPrice(amount, convertFrom, validCountryCode, rates);
  }
  
  // Handle invalid amounts
  if (isNaN(displayAmount) || displayAmount === null || displayAmount === undefined) {
    displayAmount = 0;
  }
  
  try {
    // Use Intl.NumberFormat for locale-aware formatting
    const formatter = new Intl.NumberFormat(getLocaleForCountry(validCountryCode), {
      style: showSymbol ? 'currency' : 'decimal',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    return formatter.format(displayAmount);
  } catch {
    // Fallback to simple formatting
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${displayAmount.toFixed(2)}`;
  }
}

function getLocaleForCountry(countryCode: string): string {
  const localeMap: Record<string, string> = {
    PT: 'pt-PT',
    ZA: 'en-ZA',
    GB: 'en-GB',
    TH: 'th-TH',
    US: 'en-US',
  };
  return localeMap[countryCode] || 'en-ZA';
}
