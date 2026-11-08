export const VENDOR_FEE_EARLY = 2000;
export const EARLY_VENDOR_LIMIT = 20;
export const VENDOR_FEE_STANDARD = 5000;
export const COMMISSION_RATE = 0.03;
export const COMMISSION_CAP = null; // No cap
export const CANCEL_CUTOFF_HOURS = 48;
export const SELLER_GRACE_HOURS = 24;
export const BUYER_GHOST_GRACE_HOURS = 24;
export const BAN_DAYS = 30;
export const MAX_DELIVERY_DAYS = 7;
export const PENALTY_MULTIPLIER = 2;
export const MAX_OPEN_UNPAID_ORDERS = 2;
export const COLLECTION_WARN = 6000000; // ₦6m lifetime volume warning banner
export const COLLECTION_RED = 7500000;  // ₦7.5m lifetime volume red banner

/**
 * Paystack payment processing fee (1.5% + 100 naira above 2,500, capped at 2,000 naira)
 */
export function calculateGatewayFee(amountNaira: number): number {
  if (amountNaira <= 0) return 0;
  let fee = amountNaira * 0.015;
  if (amountNaira > 2500) {
    fee += 100;
  }
  return Math.min(Math.round(fee), 2000);
}
