// Country-based VAT/tax rates
const vatRates: Record<string, { rate: number; label: string }> = {
  ZA: { rate: 0.15, label: "VAT (15%)" },
  PT: { rate: 0.23, label: "IVA (23%)" },
  GB: { rate: 0.20, label: "VAT (20%)" },
  US: { rate: 0, label: "Tax" }, // No federal sales tax on invoice
  TH: { rate: 0.07, label: "VAT (7%)" },
};

export function getVatInfo(countryCode: string): { rate: number; label: string } {
  return vatRates[countryCode] || { rate: 0.15, label: "VAT (15%)" };
}

/**
 * Calculate VAT-inclusive breakdown.
 * Assumes total_amount from API is VAT-inclusive.
 * Returns subtotal (ex-VAT), vatAmount, and total.
 */
export function calculateVatBreakdown(totalInclusive: number, countryCode: string) {
  const { rate, label } = getVatInfo(countryCode);
  if (rate === 0) {
    return { subtotal: totalInclusive, vatAmount: 0, total: totalInclusive, vatLabel: label, vatRate: rate };
  }
  const subtotal = Math.round((totalInclusive / (1 + rate)) * 100) / 100;
  const vatAmount = Math.round((totalInclusive - subtotal) * 100) / 100;
  return { subtotal, vatAmount, total: totalInclusive, vatLabel: label, vatRate: rate };
}
