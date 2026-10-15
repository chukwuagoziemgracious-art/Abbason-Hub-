/**
 * Currency and calculation utilities for Abbason Hub
 */

/**
 * Formats a number to Nigerian Naira currency display
 * e.g. 25000 -> ₦25,000
 */
export function formatNaira(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₦0';
  }
  return '₦' + Math.round(amount).toLocaleString('en-NG');
}

/**
 * Calculates platform commission:
 * Exactly 3% of the product subtotal, strictly capped at a maximum of ₦2,000.
 */
export function calculatePlatformCommission(subtotal: number): number {
  if (subtotal <= 0) return 0;
  const rawCommission = subtotal * 0.03;
  return Math.min(Math.round(rawCommission), 2000);
}

/**
 * Calculates standard Nigerian gateway payment fee (e.g. 1.5% + ₦100, capped at ₦2,000)
 * Paid transparently by the buyer at checkout.
 */
export function calculateGatewayFee(baseAmount: number): number {
  if (baseAmount <= 0) return 0;
  const percentage = baseAmount * 0.015;
  const flatFee = baseAmount > 2500 ? 100 : 0;
  const totalFee = percentage + flatFee;
  return Math.min(Math.round(totalFee), 2000);
}

/**
 * Formats an order date in readable format
 */
export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
