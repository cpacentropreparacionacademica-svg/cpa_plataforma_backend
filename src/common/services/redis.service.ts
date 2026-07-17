import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { getPositiveInteger } from '../../config/runtime-config.util';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis | null;
  private readonly keyPrefix: string;
  private isAvailable = false;

  constructor(private readonly config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL', '').trim();
    this.keyPrefix = this.config.get<string>('REDIS_KEY_PREFIX', 'cpa:backend').trim() || 'cpa:backend';
    if (!redisUrl) {
      this.client = null;
      return;
    }

    this.client = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: Number(this.config.get<string>('REDIS_MAX_RETRIES_PER_REQUEST', '1')),
      enableOfflineQueue: false,
      connectTimeout: getPositiveInteger(this.config, 'REDIS_CONNECT_TIMEOUT_MS', 2000),
      commandTimeout: getPositiveInteger(this.config, 'REDIS_COMMAND_TIMEOUT_MS', 1500),
      retryStrategy: (attempt) => Math.min(attempt * 250, 5000),
    });
    this.client.on('ready', () => { this.isAvailable = true; });
    this.client.on('end', () => { this.isAvailable = false; });
    this.client.on('error', (error) => {
      if (this.isAvailable) this.logger.warn(`Redis became unavailable: ${error.message}`);
      this.isAvailable = false;
    });
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      if (this.client.status === 'wait') await this.client.connect();
      this.isAvailable = (await this.client.ping()) === 'PONG';
      return this.isAvailable;
    } catch {
      this.isAvailable = false;
      return false;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const client = await this.getClient();
    if (!client) return null;
    try {
      const value = await client.get(this.buildKey(key));
      return value ? JSON.parse(value) as T : null;
    } catch {
      this.isAvailable = false;
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return;
    const client = await this.getClient();
    if (!client) return;
    try {
      await client.set(this.buildKey(key), JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      this.isAvailable = false;
    }
  }

  async delete(key: string): Promise<void> {
    const client = await this.getClient();
    if (!client) return;
    try {
      await client.del(this.buildKey(key));
    } catch {
      this.isAvailable = false;
    }
  }

  async incrementWithTtl(key: string, ttlSeconds: number): Promise<number | null> {
    if (ttlSeconds <= 0) return null;
    const client = await this.getClient();
    if (!client) return null;
    try {
      const redisKey = this.buildKey(key);
      const count = await client.incr(redisKey);
      if (count === 1) await client.expire(redisKey, ttlSeconds);
      return count;
    } catch {
      this.isAvailable = false;
      return null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) return;
    if (this.client.status === 'ready') {
      await this.client.quit().catch(() => this.client?.disconnect(false));
      return;
    }
    this.client.disconnect(false);
  }

  private async getClient(): Promise<Redis | null> {
    if (!this.client) return null;
    if (this.client.status === 'ready' && this.isAvailable) return this.client;
    return (await this.ping()) ? this.client : null;
  }

  private buildKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }
}
