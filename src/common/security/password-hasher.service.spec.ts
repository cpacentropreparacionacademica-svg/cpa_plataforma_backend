import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { PasswordHasherService } from './password-hasher.service';

function createService(): PasswordHasherService {
  const values: Record<string, string> = {
    PASSWORD_SCRYPT_COST: '16384',
    PASSWORD_SCRYPT_BLOCK_SIZE: '8',
    PASSWORD_SCRYPT_PARALLELIZATION: '1',
    PASSWORD_SCRYPT_KEY_LENGTH: '64',
  };
  const config = {
    get: (key: string, fallback?: string) => values[key] ?? fallback,
  } as ConfigService;
  return new PasswordHasherService(config);
}

describe('PasswordHasherService', () => {
  it('creates unique salted hashes and verifies the correct password', async () => {
    const service = createService();
    const firstHash = await service.hash('A-strong-test-password');
    const secondHash = await service.hash('A-strong-test-password');

    expect(firstHash).toMatch(/^scrypt\$/);
    expect(secondHash).toMatch(/^scrypt\$/);
    expect(firstHash).not.toBe(secondHash);
    await expect(service.verify('A-strong-test-password', firstHash)).resolves.toEqual({
      valid: true,
      needsUpgrade: false,
    });
    await expect(service.verify('wrong-password', firstHash)).resolves.toEqual({
      valid: false,
      needsUpgrade: false,
    });
  });

  it('recognises a valid legacy SHA-256 hash and requests an upgrade', async () => {
    const service = createService();
    const legacyHash = createHash('sha256').update('legacy-password').digest('hex');

    await expect(service.verify('legacy-password', legacyHash)).resolves.toEqual({
      valid: true,
      needsUpgrade: true,
    });
  });
});
