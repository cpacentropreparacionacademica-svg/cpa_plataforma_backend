import { createHash, randomBytes, randomInt, timingSafeEqual } from 'crypto';

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function generateOpaqueToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url');
}

/** Generates a cryptographically secure fixed-width decimal action token. */
export function generateNumericToken(digits = 6): string {
  if (!Number.isSafeInteger(digits) || digits < 6 || digits > 9) {
    throw new Error('Numeric token length must be between 6 and 9 digits.');
  }
  return randomInt(0, 10 ** digits).toString().padStart(digits, '0');
}

export function safeCompare(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
