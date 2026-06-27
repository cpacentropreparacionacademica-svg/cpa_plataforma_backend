import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { RedisService } from '../../common/services/redis.service';

@Controller()
export class HealthController {
  constructor(private readonly redis: RedisService) {}

  @Public()
  @Get('health')
  async health() {
    const redisEnabled = this.redis.isEnabled();
    const redisOk = redisEnabled ? await this.redis.ping() : null;

    return {
      success: true,
      ok: true,
      message: 'Servidor funcionando correctamente',
      timestamp: new Date().toISOString(),
      dependencies: {
        redis: {
          enabled: redisEnabled,
          ok: redisOk,
        },
      },
    };
  }
}
