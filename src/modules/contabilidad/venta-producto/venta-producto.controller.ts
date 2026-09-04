import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { VentaProductoService } from './venta-producto.service';
import { VentaProductoBody } from './venta-producto.types';

/**
 * Se registra antes que ContabilidadController, cuyas rutas comodín
 * `:resourcePath/:id` capturarían `contabilidad/venta-producto/registrar`.
 */
@ApiTags('contabilidad')
@ApiCookieAuth()
@Controller('contabilidad/venta-producto')
export class VentaProductoController {
  constructor(private readonly ventaProducto: VentaProductoService) {}

  @Post('registrar')
  @RequirePermission('CONTABILIDAD.VENTA_PRODUCTO.REGISTRAR')
  registrar(@Body() body: VentaProductoBody, @Req() request: Request) {
    return this.ventaProducto.registrar(body, request.user?.idPersona);
  }
}
