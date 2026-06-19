import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class HealthController {
  @Public()
  @Get('health')
  health() {
    return {
      success: true,
      ok: true,
      message: 'Servidor funcionando correctamente',
      timestamp: new Date().toISOString(),
    };
  }
}
