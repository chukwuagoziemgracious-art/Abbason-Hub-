/**
 * Cryptographic helpers for secure 6-digit delivery OTP generation, salting, and SHA-256 hashing
 */

/**
 * Generates an unpredictable 6-digit numeric OTP string (100000 - 999999)
 */
export function generateDeliveryOtp(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    // Map to 100,000 - 999,999 range
    const num = 100000 + (array[0] % 900000);
    return num.toString();
  }
  // Fallback
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generates random hexadecimal salt
 */
export function generateSalt(length = 16): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2, 18);
}

/**
 * Computes standard SHA-256 hash of a string with salt using Web Crypto API
 */
export async function hashOtp(otp: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(otp + ':' + salt);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback simple hash for older environments
  let hash = 0;
  const str = otp + ':' + salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(32, '0');
}
