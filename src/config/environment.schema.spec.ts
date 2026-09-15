import { parseCorsOrigins, validateEnvironment } from './environment.schema';

describe('environment configuration', () => {
  it('rejects wildcard origins', () => {
    expect(() => parseCorsOrigins('https://*.example.com')).toThrow('does not accept wildcards');
  });

  /**
   * Estos tres son los errores de configuración que más veces dejan el contenedor
   * en bucle de reinicios. El mensaje debe nombrar el valor ofensor: un «Invalid URL»
   * a secas no dice ni qué variable revisar.
   */
  it('rejects an origin without a scheme naming the offending value', () => {
    expect(() => parseCorsOrigins('app.example.com')).toThrow(
      'CORS origin must be an exact HTTP(S) origin: app.example.com',
    );
  });

  it('rejects an origin with a trailing slash', () => {
    expect(() => parseCorsOrigins('https://app.example.com/')).toThrow('must be an exact HTTP(S) origin');
  });

  it('rejects an origin that carries a path', () => {
    expect(() => parseCorsOrigins('https://app.example.com/app')).toThrow('must be an exact HTTP(S) origin');
  });

  it('accepts several origins separated by commas, trimming spaces', () => {
    expect(parseCorsOrigins('https://a.example.com, https://b.example.com')).toEqual([
      'https://a.example.com',
      'https://b.example.com',
    ]);
  });

  it('fails closed when production authentication or secure cookies are disabled', () => {
    expect(() => validateEnvironment({
      NODE_ENV: 'production',
      PGPASSWORD: 'test-only',
      CORS_ORIGINS: 'https://app.example.com',
      AUTH_REQUIRED: 'false',
      SESSION_COOKIE_SECURE: 'false',
    })).toThrow();
  });

  it('normalises an exact production configuration', () => {
    const environment = validateEnvironment({
      NODE_ENV: 'production',
      PGPASSWORD: 'test-only',
      CORS_ORIGINS: 'https://app.example.com',
      AUTH_REQUIRED: 'true',
      SESSION_COOKIE_SECURE: 'true',
    });

    expect(environment.PGPORT).toBe('5432');
    expect(environment.CORS_ORIGINS).toBe('https://app.example.com');
  });
});
