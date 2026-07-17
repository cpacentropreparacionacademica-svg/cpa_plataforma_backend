import { parseCorsOrigins, validateEnvironment } from './environment.schema';

describe('environment configuration', () => {
  it('rejects wildcard origins', () => {
    expect(() => parseCorsOrigins('https://*.example.com')).toThrow('does not accept wildcards');
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
