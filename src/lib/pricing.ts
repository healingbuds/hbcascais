import { convertPrice } from './currency';

/**
 * Resolve display price for an order line item.
 * 
 * Order items store `unit_price` in USD (the Dr Green API base currency).
 * For display, we convert to the order's local currency using exchange rates.
 * 
 * If the order already has a `currency` field matching the country, we check
 * whether `total_amount` looks pre-converted (heuristic: total > sum of USD items * 2).
 */
export function resolveOrderItemPrice(
  unitPriceUsd: number,
  countryCode: string,
): number {
  // unit_price is always USD from the API — convert to local
  return convertPrice(unitPriceUsd, 'USD', countryCode);
}

/**
 * Check if an order's total_amount is already in local currency
 * (i.e., not in USD). This is a heuristic based on comparing the
 * sum of USD item prices to the stored total.
 */
export function isOrderTotalLocal(
  items: Array<{ unit_price: number; quantity: number }>,
  totalAmount: number,
): boolean {
  if (!items.length || totalAmount <= 0) return false;
  const usdTotal = items.reduce((s, i) => s + (Number(i.unit_price) || 0) * (i.quantity || 0), 0);
  if (usdTotal <= 0) return true; // can't determine, assume local
  // If the stored total is more than 1.5x the USD sum, it's likely already converted
  return totalAmount > usdTotal * 1.5;
}
