import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'crypto';

interface ScryptParameters {
  cost: number;
  blockSize: number;
  parallelization: number;
  keyLength: number;
}

export interface PasswordVerification {
  valid: boolean;
  needsUpgrade: boolean;
}

/**
 * Creates versioned, salted, memory-hard password hashes.
 *
 * Legacy SHA-256 hashes remain readable only to support a controlled upgrade on
 * the next successful login. New and changed passwords are always stored using
 * scrypt and a unique random salt.
 */
@Injectable()
export class PasswordHasherService {
  constructor(private readonly config: ConfigService) {}

  async hash(password: string): Promise<string> {
    const parameters = this.getParameters();
    const salt = randomBytes(16);
    const derivedKey = await this.deriveKey(password, salt, parameters);
    return [
      'scrypt',
      parameters.cost,
      parameters.blockSize,
      parameters.parallelization,
      parameters.keyLength,
      salt.toString('base64url'),
      derivedKey.toString('base64url'),
    ].join('$');
  }

  async verify(password: string, storedHash: string): Promise<PasswordVerification> {
    if (/^[a-f0-9]{64}$/i.test(storedHash)) {
      const legacyHash = createHash('sha256').update(password).digest('hex');
      return { valid: safeBufferCompare(Buffer.from(legacyHash), Buffer.from(storedHash)), needsUpgrade: true };
    }

    const parts = storedHash.split('$');
    if (parts.length !== 7 || parts[0] !== 'scrypt') return { valid: false, needsUpgrade: false };

    const parameters: ScryptParameters = {
      cost: Number(parts[1]),
      blockSize: Number(parts[2]),
      parallelization: Number(parts[3]),
      keyLength: Number(parts[4]),
    };
    if (!this.areParametersSafe(parameters)) return { valid: false, needsUpgrade: false };

    try {
      const salt = Buffer.from(parts[5], 'base64url');
      const expectedKey = Buffer.from(parts[6], 'base64url');
      const actualKey = await this.deriveKey(password, salt, parameters);
      const valid = safeBufferCompare(actualKey, expectedKey);
      return { valid, needsUpgrade: valid && this.parametersChanged(parameters) };
    } catch {
      return { valid: false, needsUpgrade: false };
    }
  }

  private getParameters(): ScryptParameters {
    return {
      cost: Number(this.config.get<string>('PASSWORD_SCRYPT_COST', '16384')),
      blockSize: Number(this.config.get<string>('PASSWORD_SCRYPT_BLOCK_SIZE', '8')),
      parallelization: Number(this.config.get<string>('PASSWORD_SCRYPT_PARALLELIZATION', '1')),
      keyLength: Number(this.config.get<string>('PASSWORD_SCRYPT_KEY_LENGTH', '64')),
    };
  }

  private areParametersSafe(parameters: ScryptParameters): boolean {
    return Number.isSafeInteger(parameters.cost)
      && parameters.cost >= 16384
      && (parameters.cost & (parameters.cost - 1)) === 0
      && Number.isSafeInteger(parameters.blockSize)
      && parameters.blockSize >= 8
      && Number.isSafeInteger(parameters.parallelization)
      && parameters.parallelization >= 1
      && Number.isSafeInteger(parameters.keyLength)
      && parameters.keyLength >= 32
      && parameters.keyLength <= 128;
  }

  private parametersChanged(parameters: ScryptParameters): boolean {
    const current = this.getParameters();
    return Object.entries(current).some(([key, value]) => parameters[key as keyof ScryptParameters] !== value);
  }

  private deriveKey(password: string, salt: Buffer, parameters: ScryptParameters): Promise<Buffer> {
    const minimumMemory = 128 * parameters.cost * parameters.blockSize;
    const maxmem = Math.max(64 * 1024 * 1024, minimumMemory + 32 * 1024 * 1024);
    return new Promise((resolve, reject) => {
      scrypt(
        password,
        salt,
        parameters.keyLength,
        { N: parameters.cost, r: parameters.blockSize, p: parameters.parallelization, maxmem },
        (error, derivedKey) => error ? reject(error) : resolve(derivedKey),
      );
    });
  }
}

function safeBufferCompare(left: Buffer, right: Buffer): boolean {
  return left.length === right.length && timingSafeEqual(left, right);
}
