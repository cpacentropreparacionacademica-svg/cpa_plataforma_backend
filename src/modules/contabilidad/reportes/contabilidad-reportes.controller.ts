import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { ContabilidadEstadosFinancierosService } from './contabilidad-estados-financieros.service';
import { ContabilidadLibrosService } from './contabilidad-libros.service';
import { ContabilidadPeriodosService } from './contabilidad-periodos.service';
import { ContabilidadSelectoresService } from './contabilidad-selectores.service';

/**
 * Endpoints de lectura orientados a pantalla.
 *
 * Cada ruta devuelve exactamente lo que su pantalla necesita: los listados pagina y agrega
 * la base de datos, los selectores devuelven DTO mínimos y el tablero resuelve sus métricas
 * en una sola consulta agregada. Todos exigen permiso explícito, porque no resuelven
 * `:resourcePath` y por tanto el guard genérico no podría derivarlo.
 */
@ApiTags('contabilidad-reportes')
@ApiCookieAuth()
@Controller('contabilidad/reportes')
export class ContabilidadReportesController {
  constructor(
    private readonly libros: ContabilidadLibrosService,
    private readonly estados: ContabilidadEstadosFinancierosService,
    private readonly periodos: ContabilidadPeriodosService,
    private readonly selectores: ContabilidadSelectoresService,
  ) {}

  @Get('libro-diario')
  @RequirePermission('CONTABILIDAD.LIBRO_DIARIO.READ')
  getLibroDiario(@Query() query: Record<string, unknown>) {
    return this.libros.getLibroDiario(query);
  }

  @Get('libro-mayor')
  @RequirePermission('CONTABILIDAD.LIBRO_MAYOR.READ')
  getLibroMayor(@Query() query: Record<string, unknown>) {
    return this.libros.getLibroMayor(query);
  }

  @Get('balance-comprobacion')
  @RequirePermission('CONTABILIDAD.BALANCE_COMPROBACION.READ')
  getBalanceComprobacion(@Query() query: Record<string, unknown>) {
    return this.libros.getBalanceComprobacion(query);
  }

  @Get('estado-resultados')
  @RequirePermission('CONTABILIDAD.ESTADO_RESULTADOS.READ')
  getEstadoResultados(@Query() query: Record<string, unknown>) {
    return this.estados.getEstadoResultados(query);
  }

  @Get('balance-general')
  @RequirePermission('CONTABILIDAD.BALANCE_GENERAL.READ')
  getBalanceGeneral(@Query() query: Record<string, unknown>) {
    return this.estados.getBalanceGeneral(query);
  }

  @Get('dashboard')
  @RequirePermission('CONTABILIDAD.DASHBOARD.READ')
  getDashboard(@Query() query: Record<string, unknown>) {
    return this.estados.getDashboard(query);
  }

  /** Selector ligero de cuentas: id, código y etiqueta. Nunca la entidad completa. */
  @Get('selector/cuentas')
  @RequirePermission('CONTABILIDAD.CUENTA.READ')
  getSelectorCuentas(@Query() query: Record<string, unknown>) {
    return this.selectores.buscarCuentas(query);
  }

  @Get('periodos')
  @RequirePermission('CONTABILIDAD.PERIODO.READ')
  listarPeriodos() {
    return this.periodos.listar();
  }

  @Post('periodos')
  @RequirePermission('CONTABILIDAD.PERIODO.CREATE')
  crearPeriodo(@Body() body: Record<string, unknown>, @Req() request: Request) {
    return this.periodos.crear(body, request.user?.idPersona);
  }

  @Post('periodos/:id/cerrar')
  @RequirePermission('CONTABILIDAD.PERIODO.CERRAR')
  cerrarPeriodo(@Param('id') id: string, @Body() body: Record<string, unknown>, @Req() request: Request) {
    return this.periodos.cerrar(id, body, request.user?.idPersona);
  }

  @Post('periodos/:id/reabrir')
  @RequirePermission('CONTABILIDAD.PERIODO.REABRIR')
  reabrirPeriodo(@Param('id') id: string, @Body() body: Record<string, unknown>, @Req() request: Request) {
    return this.periodos.reabrir(id, body, request.user?.idPersona);
  }
}
