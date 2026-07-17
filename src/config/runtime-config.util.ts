import { ConfigService } from '@nestjs/config';

/** Reads a validated positive integer from ConfigService. */
export function getPositiveInteger(config: ConfigService, key: string, fallback: number): number {
  const configuredValue = config.get<string | number>(key);
  const value = Number(configuredValue ?? fallback);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${key} must be a positive safe integer.`);
  return value;
}

/** Converts TRUST_PROXY into a constrained Express-compatible value. */
export function getTrustProxy(config: ConfigService): boolean | number | string {
  const value = String(config.get<string>('TRUST_PROXY', 'false')).trim();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  if (new Set(['loopback', 'linklocal', 'uniquelocal']).has(value)) return value;
  throw new Error('TRUST_PROXY must be true, false, a hop count, or a supported named subnet.');
}
