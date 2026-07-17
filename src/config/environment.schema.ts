type Environment = Record<string, unknown>;

const BOOLEAN_VALUES = new Set(['true', 'false']);
const SAME_SITE_VALUES = new Set(['lax', 'strict', 'none']);
const NODE_ENVIRONMENTS = new Set(['development', 'test', 'production']);

/** Validates and normalizes process configuration before the application starts. */
export function validateEnvironment(input: Environment): Environment {
  const environment: Environment = {
    ...input,
    NODE_ENV: readString(input, 'NODE_ENV', 'development'),
    PORT: readPositiveInteger(input, 'PORT', 3000),
    HOST: readString(input, 'HOST', '0.0.0.0'),
    API_PREFIX: readString(input, 'API_PREFIX', 'api'),
    CORS_ORIGINS: readString(input, 'CORS_ORIGINS', ''),
    TRUST_PROXY: readString(input, 'TRUST_PROXY', 'false'),
    JSON_BODY_LIMIT: readBodyLimit(input, 'JSON_BODY_LIMIT', '1mb'),
    URL_ENCODED_BODY_LIMIT: readBodyLimit(input, 'URL_ENCODED_BODY_LIMIT', '256kb'),
    SWAGGER_ENABLED: readBoolean(input, 'SWAGGER_ENABLED', false),
    PGHOST: readString(input, 'PGHOST', 'localhost'),
    PGPORT: readPositiveInteger(input, 'PGPORT', 5432),
    PGDATABASE: readString(input, 'PGDATABASE', 'cpa_platform'),
    PGUSER: readString(input, 'PGUSER', 'cpa_backend'),
    PGPASSWORD: readRequiredString(input, 'PGPASSWORD'),
    PGSSLMODE: readEnum(input, 'PGSSLMODE', 'disable', new Set(['disable', 'require'])),
    PGSSL_REJECT_UNAUTHORIZED: readBoolean(input, 'PGSSL_REJECT_UNAUTHORIZED', true),
    DB_LOGGING: readBoolean(input, 'DB_LOGGING', false),
    DB_POOL_MAX: readPositiveInteger(input, 'DB_POOL_MAX', 10),
    DB_POOL_MIN: readNonNegativeInteger(input, 'DB_POOL_MIN', 1),
    DB_POOL_IDLE_MS: readPositiveInteger(input, 'DB_POOL_IDLE_MS', 30000),
    DB_POOL_ACQUIRE_MS: readPositiveInteger(input, 'DB_POOL_ACQUIRE_MS', 10000),
    DB_STATEMENT_TIMEOUT_MS: readPositiveInteger(input, 'DB_STATEMENT_TIMEOUT_MS', 15000),
    DB_QUERY_TIMEOUT_MS: readPositiveInteger(input, 'DB_QUERY_TIMEOUT_MS', 20000),
    AUTH_REQUIRED: readBoolean(input, 'AUTH_REQUIRED', true),
    ENABLE_PUBLIC_SIGNUP: readBoolean(input, 'ENABLE_PUBLIC_SIGNUP', false),
    SESSION_COOKIE_NAME: readString(input, 'SESSION_COOKIE_NAME', 'cpa_session'),
    SESSION_TTL_MINUTES: readPositiveInteger(input, 'SESSION_TTL_MINUTES', 480),
    SESSION_COOKIE_SECURE: readBoolean(input, 'SESSION_COOKIE_SECURE', false),
    SESSION_SAME_SITE: readEnum(input, 'SESSION_SAME_SITE', 'lax', SAME_SITE_VALUES),
    SESSION_CACHE_TTL_SECONDS: readPositiveInteger(input, 'SESSION_CACHE_TTL_SECONDS', 300),
    ALLOW_SESSION_HEADER: readBoolean(input, 'ALLOW_SESSION_HEADER', true),
    PASSWORD_SCRYPT_COST: readPowerOfTwo(input, 'PASSWORD_SCRYPT_COST', 16384),
    PASSWORD_SCRYPT_BLOCK_SIZE: readPositiveInteger(input, 'PASSWORD_SCRYPT_BLOCK_SIZE', 8),
    PASSWORD_SCRYPT_PARALLELIZATION: readPositiveInteger(input, 'PASSWORD_SCRYPT_PARALLELIZATION', 1),
    PASSWORD_SCRYPT_KEY_LENGTH: readRangeInteger(input, 'PASSWORD_SCRYPT_KEY_LENGTH', 64, 32, 128),
    ACTION_TOKEN_TTL_MINUTES: readPositiveInteger(input, 'ACTION_TOKEN_TTL_MINUTES', 15),
    REDIS_URL: readString(input, 'REDIS_URL', ''),
    REDIS_KEY_PREFIX: readString(input, 'REDIS_KEY_PREFIX', 'cpa:backend'),
    REDIS_CONNECT_TIMEOUT_MS: readPositiveInteger(input, 'REDIS_CONNECT_TIMEOUT_MS', 2000),
    REDIS_COMMAND_TIMEOUT_MS: readPositiveInteger(input, 'REDIS_COMMAND_TIMEOUT_MS', 1500),
    REDIS_MAX_RETRIES_PER_REQUEST: readNonNegativeInteger(input, 'REDIS_MAX_RETRIES_PER_REQUEST', 1),
    RATE_LIMIT_WINDOW_MS: readPositiveInteger(input, 'RATE_LIMIT_WINDOW_MS', 900000),
    RATE_LIMIT_MAX: readPositiveInteger(input, 'RATE_LIMIT_MAX', 100),
    RATE_LIMIT_FALLBACK_MAX_BUCKETS: readPositiveInteger(input, 'RATE_LIMIT_FALLBACK_MAX_BUCKETS', 10000),
    LOGIN_RATE_LIMIT_WINDOW_MS: readPositiveInteger(input, 'LOGIN_RATE_LIMIT_WINDOW_MS', 900000),
    LOGIN_RATE_LIMIT_MAX: readPositiveInteger(input, 'LOGIN_RATE_LIMIT_MAX', 10),
  };

  readEnum(environment, 'NODE_ENV', 'development', NODE_ENVIRONMENTS);
  parseCorsOrigins(String(environment.CORS_ORIGINS));
  if (Number(environment.DB_POOL_MIN) > Number(environment.DB_POOL_MAX)) throw new Error('DB_POOL_MIN cannot exceed DB_POOL_MAX.');
  if (environment.SESSION_SAME_SITE === 'none' && environment.SESSION_COOKIE_SECURE !== 'true') {
    throw new Error('SESSION_SAME_SITE=none requires SESSION_COOKIE_SECURE=true.');
  }
  if (environment.NODE_ENV === 'production') {
    if (parseCorsOrigins(String(environment.CORS_ORIGINS)).length === 0) throw new Error('CORS_ORIGINS is required in production.');
    if (environment.AUTH_REQUIRED !== 'true') throw new Error('AUTH_REQUIRED cannot be false in production.');
    if (environment.SESSION_COOKIE_SECURE !== 'true') throw new Error('SESSION_COOKIE_SECURE must be true in production.');
  }
  return environment;
}

export function parseCorsOrigins(value: string): string[] {
  const origins = value.split(',').map((origin) => origin.trim()).filter(Boolean);
  for (const origin of origins) {
    if (origin.includes('*')) throw new Error('CORS_ORIGINS does not accept wildcards.');
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) {
      throw new Error(`CORS origin must be an exact HTTP(S) origin: ${origin}`);
    }
  }
  return [...new Set(origins)];
}

function readString(input: Environment, key: string, fallback: string): string {
  return String(input[key] ?? fallback).trim();
}
function readRequiredString(input: Environment, key: string): string {
  const value = readString(input, key, '');
  if (!value) throw new Error(`${key} is required.`);
  return value;
}
function readBoolean(input: Environment, key: string, fallback: boolean): string {
  const value = String(input[key] ?? fallback).toLowerCase();
  if (!BOOLEAN_VALUES.has(value)) throw new Error(`${key} must be true or false.`);
  return value;
}
function readPositiveInteger(input: Environment, key: string, fallback: number): string {
  return readRangeInteger(input, key, fallback, 1, Number.MAX_SAFE_INTEGER);
}
function readNonNegativeInteger(input: Environment, key: string, fallback: number): string {
  return readRangeInteger(input, key, fallback, 0, Number.MAX_SAFE_INTEGER);
}
function readRangeInteger(input: Environment, key: string, fallback: number, minimum: number, maximum: number): string {
  const value = Number(input[key] ?? fallback);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new Error(`${key} is outside the accepted range.`);
  return String(value);
}
function readPowerOfTwo(input: Environment, key: string, fallback: number): string {
  const value = Number(readPositiveInteger(input, key, fallback));
  if (value < 16384 || (value & (value - 1)) !== 0) throw new Error(`${key} must be a power of two of at least 16384.`);
  return String(value);
}
function readEnum(input: Environment, key: string, fallback: string, allowedValues: Set<string>): string {
  const value = String(input[key] ?? fallback).trim();
  if (!allowedValues.has(value)) throw new Error(`${key} has an unsupported value.`);
  return value;
}
function readBodyLimit(input: Environment, key: string, fallback: string): string {
  const value = readString(input, key, fallback);
  if (!/^\d+(?:kb|mb)$/i.test(value)) throw new Error(`${key} must use a kb or mb unit.`);
  return value;
}
