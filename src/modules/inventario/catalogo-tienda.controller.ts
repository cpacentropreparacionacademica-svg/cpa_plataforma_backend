import { Controller, Get, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CatalogoTiendaService } from './catalogo-tienda.service';

/**
 * Se registra antes que InventarioController, cuyas rutas comodín
 * `:resourcePath` capturarían `inventario/catalogo-tienda`.
 */
@ApiTags('inventario')
@ApiCookieAuth()
@Controller('inventario/catalogo-tienda')
export class CatalogoTiendaController {
  constructor(private readonly catalogo: CatalogoTiendaService) {}

  @Get()
  @RequirePermission('INVENTARIO.CATALOGO_TIENDA.READ')
  list(@Query() query: Record<string, unknown>) {
    return this.catalogo.list(query);
  }
}
