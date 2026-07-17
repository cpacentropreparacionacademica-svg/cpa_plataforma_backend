import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';
import { RedisService } from '../../common/services/redis.service';

@Controller()
export class HealthController {
  constructor(private readonly dataSource: DataSource, private readonly redis: RedisService) {}

  @Public()
  @Get('health/live')
  live(): { status: 'ok'; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('health/ready')
  async ready(): Promise<{ status: 'ready'; timestamp: string }> {
    const databaseReady = await this.checkDatabase();
    const redisReady = !this.redis.isEnabled() || (await this.redis.ping());
    if (!databaseReady || !redisReady) {
      throw new ServiceUnavailableException('La aplicación todavía no está lista para recibir tráfico.');
    }
    return { status: 'ready', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('health')
  async legacyHealth(): Promise<{ status: 'ready'; timestamp: string }> {
    return this.ready();
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
