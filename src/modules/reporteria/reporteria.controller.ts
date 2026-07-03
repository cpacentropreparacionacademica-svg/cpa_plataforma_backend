import { Controller, Get, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { ResourceModuleName } from '../../common/decorators/resource-module.decorator';
import { ReporteriaContabilidadService } from './reporteria-contabilidad.service';

@ApiTags('reporteria')
@ApiCookieAuth()
@ResourceModuleName('reporteria')
@Controller('reporteria')
export class ReporteriaController {
  constructor(private readonly contabilidad: ReporteriaContabilidadService) {}

  @Get('contabilidad/powerbi-movimientos')
  getPowerBiMovimientos(@Query() query: Record<string, unknown>) {
    return this.contabilidad.getPowerBiMovimientos(query);
  }
}
